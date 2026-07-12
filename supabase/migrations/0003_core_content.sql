-- Phase 3 (part 1): core content + learning tables.
-- Conventions match 0001: uuid PK, legacy_mongo_id, embedded arrays → jsonb,
-- user_id/question_id FKs; other cross-refs are plain uuid (FKs added later
-- once every table exists). RLS on (service-role only).

create table notes (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references users(id) on delete cascade,
  question_id uuid references questions(id) on delete set null,
  challenge_id uuid,
  title text not null default '',
  content text not null default '',
  is_private boolean not null default true,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_idx on notes (user_id);

create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references users(id) on delete cascade,
  kind text not null,
  question_id uuid,
  challenge_id uuid,
  discussion_id uuid,
  list text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookmarks_user_idx on bookmarks (user_id);

create table progress (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references users(id) on delete cascade,
  track text not null,
  topic_solves jsonb not null default '{}',
  completed_topics text[] not null default '{}',
  percent numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, track)
);

create table daily_activity (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references users(id) on delete cascade,
  date text not null,
  submissions integer not null default 0,
  accepted integer not null default 0,
  xp_earned integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table spaced_repetition (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references users(id) on delete cascade,
  question_id uuid,
  interval integer not null default 0,
  repetitions integer not null default 0,
  ease_factor numeric not null default 2.5,
  next_review timestamptz,
  last_review timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index spaced_rep_user_next_idx on spaced_repetition (user_id, next_review);

create table discussions (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  question_id uuid,
  challenge_id uuid,
  author_id uuid references users(id) on delete set null,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  kind text not null default 'discussion' check (kind in ('discussion','solution','question')),
  language text,
  upvotes jsonb not null default '[]',
  downvotes jsonb not null default '[]',
  replies jsonb not null default '[]',
  is_pinned boolean not null default false,
  ai_summary text,
  ai_summary_at timestamptz,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index discussions_question_idx on discussions (question_id);

create table contests (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  slug text not null unique,
  title text not null,
  description text not null default '',
  type text not null,
  starts_at timestamptz,
  duration_minutes integer not null default 0,
  questions jsonb not null default '[]',
  participants jsonb not null default '[]',
  is_published boolean not null default false,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roadmaps (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  track text not null,
  title text not null,
  description text not null default '',
  sections jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  slug text not null unique,
  name text not null,
  description text not null default '',
  logo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table badges (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  key text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default '',
  tier text not null check (tier in ('bronze','silver','gold')),
  criteria jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_badges (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references users(id) on delete cascade,
  badge_id uuid,
  awarded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table follows (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  follower_id uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id)
);

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  slug text not null unique,
  title text not null,
  description text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  seo_title text not null default '',
  seo_description text not null default '',
  seo_keywords text not null default '',
  cover_data text,
  cover_mime text,
  author_id uuid references users(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','published')),
  views integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_status_idx on blog_posts (status);

-- updated_at triggers
create trigger t_notes_updated             before update on notes            for each row execute function set_updated_at();
create trigger t_bookmarks_updated         before update on bookmarks        for each row execute function set_updated_at();
create trigger t_progress_updated          before update on progress         for each row execute function set_updated_at();
create trigger t_daily_activity_updated    before update on daily_activity   for each row execute function set_updated_at();
create trigger t_spaced_repetition_updated before update on spaced_repetition for each row execute function set_updated_at();
create trigger t_discussions_updated       before update on discussions      for each row execute function set_updated_at();
create trigger t_contests_updated          before update on contests         for each row execute function set_updated_at();
create trigger t_roadmaps_updated          before update on roadmaps         for each row execute function set_updated_at();
create trigger t_companies_updated         before update on companies        for each row execute function set_updated_at();
create trigger t_badges_updated            before update on badges           for each row execute function set_updated_at();
create trigger t_blog_posts_updated        before update on blog_posts       for each row execute function set_updated_at();

-- RLS: backend-only
alter table notes             enable row level security;
alter table bookmarks         enable row level security;
alter table progress          enable row level security;
alter table daily_activity    enable row level security;
alter table spaced_repetition enable row level security;
alter table discussions       enable row level security;
alter table contests          enable row level security;
alter table roadmaps          enable row level security;
alter table companies         enable row level security;
alter table badges            enable row level security;
alter table user_badges       enable row level security;
alter table follows           enable row level security;
alter table blog_posts        enable row level security;
