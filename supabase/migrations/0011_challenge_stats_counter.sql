-- Atomic increment of a frontend challenge's stats jsonb counters, mirroring
-- Mongo's { $inc: { "stats.attempts": .., "stats.completed": .. } }.
create or replace function increment_challenge_stats(
  p_challenge uuid,
  p_attempts integer,
  p_completed integer
)
returns void
language sql
as $$
  update frontend_challenges
  set stats = jsonb_set(
        jsonb_set(
          coalesce(stats, '{}'::jsonb),
          '{attempts}',
          to_jsonb(coalesce((stats->>'attempts')::int, 0) + p_attempts)
        ),
        '{completed}',
        to_jsonb(coalesce((stats->>'completed')::int, 0) + p_completed)
      ),
      updated_at = now()
  where id = p_challenge;
$$;
