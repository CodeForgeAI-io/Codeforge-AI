-- Atomic daily-activity upsert (heatmap source), mirroring Mongo's { $inc }.
create or replace function increment_daily_activity(
  p_user uuid,
  p_date text,
  p_submissions integer,
  p_accepted integer,
  p_xp integer
)
returns void
language sql
as $$
  insert into daily_activity (user_id, date, submissions, accepted, xp_earned)
  values (p_user, p_date, p_submissions, p_accepted, p_xp)
  on conflict (user_id, date) do update set
    submissions = daily_activity.submissions + p_submissions,
    accepted    = daily_activity.accepted + p_accepted,
    xp_earned   = daily_activity.xp_earned + p_xp,
    updated_at  = now();
$$;
