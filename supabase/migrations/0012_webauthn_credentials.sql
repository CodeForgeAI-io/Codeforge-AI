-- Passkeys (WebAuthn). Credentials live in Supabase and link to auth.users;
-- passkey login verifies an assertion server-side then mints a Supabase session.
create table if not exists webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,   -- base64url credential id
  public_key text not null,             -- base64url COSE public key
  counter bigint not null default 0,
  transports text[],
  name text,                            -- user-facing label ("MacBook Touch ID")
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists webauthn_credentials_user_idx on webauthn_credentials(user_id);

-- Service-role backend only (like the rest of the schema): RLS on, no policies.
alter table webauthn_credentials enable row level security;
