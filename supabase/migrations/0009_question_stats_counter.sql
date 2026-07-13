-- Atomic increment of a question's stats jsonb counters, mirroring Mongo's
-- { $inc: { "stats.submissions": .., "stats.accepted": .. } }.
create or replace function increment_question_stats(
  p_question uuid,
  p_submissions integer,
  p_accepted integer
)
returns void
language sql
as $$
  update questions
  set stats = jsonb_set(
        jsonb_set(
          coalesce(stats, '{}'::jsonb),
          '{submissions}',
          to_jsonb(coalesce((stats->>'submissions')::int, 0) + p_submissions)
        ),
        '{accepted}',
        to_jsonb(coalesce((stats->>'accepted')::int, 0) + p_accepted)
      ),
      updated_at = now()
  where id = p_question;
$$;
