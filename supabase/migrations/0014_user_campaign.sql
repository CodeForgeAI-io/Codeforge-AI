-- Acquisition campaign: which /join offer code the user claimed (e.g. LAUNCH30).
-- Set when the campaign trial subscription is created; null for organic signups.
alter table users add column if not exists campaign text;

create index if not exists users_campaign_idx on users (campaign) where campaign is not null;
