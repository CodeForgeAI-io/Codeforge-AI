-- Atomic usage-counter increments, mirroring Mongo's { $inc } upserts.
-- The service-role backend calls these via supabase.rpc(...).

create or replace function increment_ai_usage(p_user uuid, p_period text)
returns integer
language sql
as $$
  insert into ai_usage (user_id, period, used)
  values (p_user, p_period, 1)
  on conflict (user_id, period)
    do update set used = ai_usage.used + 1, updated_at = now()
  returning used;
$$;

create or replace function increment_gen_usage(p_user uuid, p_period text, p_count integer)
returns integer
language sql
as $$
  insert into gen_usage (user_id, period, count)
  values (p_user, p_period, p_count)
  on conflict (user_id, period)
    do update set count = gen_usage.count + p_count, updated_at = now()
  returning count;
$$;
