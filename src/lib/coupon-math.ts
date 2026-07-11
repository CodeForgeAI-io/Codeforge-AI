/**
 * Pure coupon arithmetic and normalization — no database or network
 * dependencies, so it is trivially unit-testable and safe to import anywhere
 * (client or server). The DB-backed validation/redemption lives in
 * `@/lib/coupons`, which re-exports these helpers.
 */

/** A coupon's discount shape — the only fields the math needs. */
export interface DiscountRule {
  type: "percent" | "flat";
  value: number;
}

/**
 * Normalize a user-entered coupon code to its canonical stored form:
 * trimmed, upper-cased, and length-capped. Coerces nullish input to `""`.
 *
 * @param code - Raw code from the client.
 * @returns The canonical code (max 40 chars).
 */
export function normalizeCode(code: string): string {
  return String(code ?? "").trim().toUpperCase().slice(0, 40);
}

/**
 * Compute the discount (in rupees) a coupon grants on an order amount.
 * Percentages are rounded to the nearest rupee, and the discount is clamped
 * to the order amount so the final total can never go negative.
 *
 * @param coupon - The coupon's `type` and `value`.
 * @param amount - Order amount in rupees.
 * @returns The discount in rupees, in the range `[0, amount]`.
 */
export function computeDiscount(coupon: DiscountRule, amount: number): number {
  if (coupon.type === "percent") {
    return Math.min(amount, Math.round((amount * coupon.value) / 100));
  }
  return Math.min(amount, Math.round(coupon.value));
}
