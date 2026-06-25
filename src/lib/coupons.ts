import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Coupon, CouponRedemption, type CouponDoc } from "@/models";
import { PLANS, type PlanId, type BillingCycle } from "@/lib/plans";

export function normalizeCode(code: string): string {
  return String(code ?? "").trim().toUpperCase().slice(0, 40);
}

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

/** Compute the discount (rupees) a coupon grants on an order amount. */
export function computeDiscount(coupon: Pick<CouponDoc, "type" | "value">, amount: number): number {
  if (coupon.type === "percent") {
    return Math.min(amount, Math.round((amount * coupon.value) / 100));
  }
  return Math.min(amount, Math.round(coupon.value));
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

  await connectDB();
  const coupon = await Coupon.findOne({ code }).lean<CouponDoc>();
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

  if (coupon.oncePerUser) {
    const already = await CouponRedemption.findOne({
      coupon: coupon._id,
      user: new Types.ObjectId(opts.userId),
    }).lean();
    if (already) return { ok: false, reason: "You've already used this coupon" };
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
  await connectDB();
  const coupon = await Coupon.findOne({ code }).select("_id maxRedemptions").lean<CouponDoc>();
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
