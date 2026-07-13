-- Atomic coupon usedCount increment with headroom check, mirroring Mongo's
-- conditional { $inc } on { usedCount: { $lt: maxRedemptions } }.
-- p_max < 0 means unlimited redemptions.
create or replace function increment_coupon_usage(p_coupon uuid, p_max integer)
returns void
language sql
as $$
  update coupons
  set used_count = used_count + 1, updated_at = now()
  where id = p_coupon and (p_max < 0 or used_count < p_max);
$$;
