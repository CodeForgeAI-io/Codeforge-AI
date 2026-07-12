-- feedback.status was missing from the Phase-1 core schema.
alter table feedback
  add column if not exists status text not null default 'new'
  check (status in ('new','read','resolved'));
create index if not exists feedback_status_idx on feedback (status);
