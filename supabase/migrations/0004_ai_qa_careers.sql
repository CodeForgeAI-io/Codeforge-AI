-- Phase 3 (part 2): AI, QA, careers, and remaining content tables.
-- Completes the schema (33 tables). Same conventions as 0001/0003.

create table frontend_challenges (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  slug text not null unique,
  title text not null,
  difficulty text not null,
  tech text not null,
  tags text[] not null default '{}',
  brief text not null default '',
  description text not null default '',
  design_spec text not null default '',
  starter_files jsonb not null default '[]',
  checklist text[] not null default '{}',
  is_published boolean not null default false,
  created_by uuid references users(id) on delete set null,
  stats jsonb not null default '{"attempts":0,"completed":0}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table job_applications (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  role text not null,
  role_title text not null default '',
  name text not null,
  email text not null,
  phone text,
  location text,
  linkedin text,
  github text,
  portfolio text,
  experience text,
  company text,
  resume_url text,
  resume_name text,
  message text,
  status text not null default 'new' check (status in ('new','reviewing','shortlisted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index job_applications_role_idx on job_applications (role);

create table bug_reports (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  reporter_id uuid references users(id) on delete set null,
  reporter_name text not null default '',
  title text not null,
  area text not null default '',
  severity text not null default '',
  steps text not null default '',
  expected text not null default '',
  actual text not null default '',
  environment text not null default '',
  url text,
  screenshot_url text,
  status text not null default 'new',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bug_reports_status_idx on bug_reports (status);

create table qa_contributors (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid references users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  motivation text not null default '',
  focus_areas text[] not null default '{}',
  experience text not null default '',
  github text,
  status text not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table prompt_templates (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  key text not null unique,
  name text not null,
  description text not null default '',
  template text not null default '',
  temperature numeric not null default 0.7,
  max_tokens integer not null default 2048,
  updated_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- singleton feature-access config (id = 'global')
create table feature_access (
  id text primary key default 'global',
  access jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table ai_chats (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references users(id) on delete cascade,
  context text not null check (context in ('question','challenge','interview','general')),
  question_id uuid,
  challenge_id uuid,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_chats_user_idx on ai_chats (user_id);

create table ai_tool_runs (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references users(id) on delete cascade,
  tool text not null,
  title text not null default '',
  input jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_tool_runs_user_tool_idx on ai_tool_runs (user_id, tool);

create table ai_usage (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references users(id) on delete cascade,
  period text not null,
  used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

create table gen_usage (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references users(id) on delete cascade,
  period text not null,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

-- updated_at triggers
create trigger t_frontend_challenges_updated before update on frontend_challenges for each row execute function set_updated_at();
create trigger t_job_applications_updated     before update on job_applications     for each row execute function set_updated_at();
create trigger t_bug_reports_updated          before update on bug_reports          for each row execute function set_updated_at();
create trigger t_qa_contributors_updated      before update on qa_contributors      for each row execute function set_updated_at();
create trigger t_prompt_templates_updated     before update on prompt_templates     for each row execute function set_updated_at();
create trigger t_feature_access_updated       before update on feature_access       for each row execute function set_updated_at();
create trigger t_ai_chats_updated             before update on ai_chats             for each row execute function set_updated_at();
create trigger t_ai_tool_runs_updated         before update on ai_tool_runs         for each row execute function set_updated_at();
create trigger t_ai_usage_updated             before update on ai_usage             for each row execute function set_updated_at();
create trigger t_gen_usage_updated            before update on gen_usage            for each row execute function set_updated_at();

-- RLS: backend-only
alter table frontend_challenges enable row level security;
alter table job_applications    enable row level security;
alter table bug_reports         enable row level security;
alter table qa_contributors     enable row level security;
alter table prompt_templates    enable row level security;
alter table feature_access      enable row level security;
alter table ai_chats            enable row level security;
alter table ai_tool_runs        enable row level security;
alter table ai_usage            enable row level security;
alter table gen_usage           enable row level security;
