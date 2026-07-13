import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Coupon, CouponRedemption, type CouponDoc } from "@/models";
import { PLANS, type PlanId, type BillingCycle } from "@/lib/plans";
import { computeDiscount, normalizeCode } from "@/lib/coupon-math";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

const be = () => backendFor("coupons");

/** Map a Supabase coupons row (snake_case) to the CouponDoc shape the math uses. */
interface SbCouponRow {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  active: boolean;
  expires_at: string | null;
  max_redemptions: number;
  used_count: number;
  plans: string[] | null;
  min_amount: number;
  once_per_user: boolean;
}
function toCouponDoc(r: SbCouponRow): CouponDoc & { _id: string } {
  return {
    _id: r.id,
    code: r.code,
    type: r.type,
    value: r.value,
    active: r.active,
    expiresAt: r.expires_at ? new Date(r.expires_at) : undefined,
    maxRedemptions: r.max_redemptions,
    usedCount: r.used_count,
    plans: r.plans ?? [],
    minAmount: r.min_amount,
    oncePerUser: r.once_per_user,
  } as unknown as CouponDoc & { _id: string };
}

// Re-exported so existing importers of `@/lib/coupons` keep working; the pure
// implementations now live in the dependency-free `@/lib/coupon-math`.
export { computeDiscount, normalizeCode };

export interface CouponResult {
  ok: boolean;
  reason?: string;
  code?: string;
  type?: "percent" | "flat";
  value?: number;
  discount?: number; // rupees
  baseAmount?: number; // rupees
  finalAmount?: number; // rupees
}

function baseAmount(plan: PlanId, cycle: BillingCycle): number {
  const def = PLANS[plan];
  return cycle === "yearly" ? def.price.yearly : def.price.monthly;
}

/**
 * Validate a coupon for a given user + plan + cycle. Pure read — does not
 * redeem. Server-authoritative: the discount it returns is what we charge.
 */
export async function validateCoupon(opts: {
  code: string;
  plan: PlanId;
  cycle: BillingCycle;
  userId: string;
}): Promise<CouponResult> {
  const code = normalizeCode(opts.code);
  if (!code) return { ok: false, reason: "Enter a coupon code" };

  let coupon: (CouponDoc & { _id: string | Types.ObjectId }) | null;
  let alreadyRedeemed: () => Promise<boolean>;

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const { data } = await sb.from("coupons").select("*").eq("code", code).maybeSingle();
    coupon = data ? toCouponDoc(data as SbCouponRow) : null;
    const couponId = data ? (data as SbCouponRow).id : null;
    alreadyRedeemed = async () => {
      if (!couponId) return false;
      const { data: r } = await sb
        .from("coupon_redemptions")
        .select("id")
        .eq("coupon_id", couponId)
        .eq("user_id", opts.userId)
        .maybeSingle();
      return Boolean(r);
    };
  } else {
    await connectDB();
    const doc = await Coupon.findOne({ code }).lean<CouponDoc & { _id: Types.ObjectId }>();
    coupon = doc ?? null;
    alreadyRedeemed = async () => {
      if (!doc) return false;
      const already = await CouponRedemption.findOne({
        coupon: doc._id,
        user: new Types.ObjectId(opts.userId),
      }).lean();
      return Boolean(already);
    };
  }

  if (!coupon || !coupon.active) return { ok: false, reason: "Invalid or inactive coupon" };

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "This coupon has expired" };
  }
  if (coupon.maxRedemptions >= 0 && coupon.usedCount >= coupon.maxRedemptions) {
    return { ok: false, reason: "This coupon has reached its limit" };
  }
  if (coupon.plans.length > 0 && !(coupon.plans as string[]).includes(opts.plan)) {
    return { ok: false, reason: "This coupon doesn't apply to the selected plan" };
  }

  const amount = baseAmount(opts.plan, opts.cycle);
  if (coupon.minAmount > 0 && amount < coupon.minAmount) {
    return { ok: false, reason: `Valid on orders of ₹${coupon.minAmount} or more` };
  }

  if (coupon.oncePerUser && (await alreadyRedeemed())) {
    return { ok: false, reason: "You've already used this coupon" };
  }

  const discount = computeDiscount(coupon, amount);
  return {
    ok: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
    baseAmount: amount,
    finalAmount: Math.max(0, amount - discount),
  };
}

/**
 * Atomically record a redemption after a successful payment. Increments the
 * coupon's usedCount only if there's headroom, and writes a per-user row
 * (idempotent via the unique (coupon,user) index).
 */
export async function redeemCoupon(opts: {
  code: string;
  userId: string;
  discount: number;
}): Promise<void> {
  const code = normalizeCode(opts.code);
  if (!code) return;

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("coupons")
      .select("id,max_redemptions")
      .eq("code", code)
      .maybeSingle();
    if (!data) return;
    const coupon = data as { id: string; max_redemptions: number };
    const { error } = await sb.from("coupon_redemptions").insert({
      coupon_id: coupon.id,
      code,
      user_id: opts.userId,
      discount: opts.discount,
    });
    // Duplicate (coupon,user) — already redeemed, don't double-count.
    if (error) return;
    await sb.rpc("increment_coupon_usage", {
      p_coupon: coupon.id,
      p_max: coupon.max_redemptions,
    });
    return;
  }

  await connectDB();
  const coupon = await Coupon.findOne({ code }).select("_id maxRedemptions").lean<CouponDoc & { _id: Types.ObjectId }>();
  if (!coupon) return;

  try {
    await CouponRedemption.create({
      coupon: coupon._id,
      code,
      user: new Types.ObjectId(opts.userId),
      discount: opts.discount,
    });
  } catch {
    // Duplicate (coupon,user) — already redeemed, don't double-count.
    return;
  }

  await Coupon.updateOne(
    coupon.maxRedemptions >= 0
      ? { _id: coupon._id, usedCount: { $lt: coupon.maxRedemptions } }
      : { _id: coupon._id },
    { $inc: { usedCount: 1 } },
  );
}
