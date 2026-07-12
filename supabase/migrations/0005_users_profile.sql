-- Phase 5: make public.users a PROFILE of Supabase Auth's auth.users.
-- Identities (email, password, OAuth) live in auth.users; public.users.id
-- equals auth.users.id. The import script inserts both together, and
-- post-cutover signups set public.users.id to the new auth user's id.

-- id is no longer generated here — it comes from auth.users.
alter table public.users alter column id drop default;

-- Link + cascade delete: removing an auth user removes their profile.
alter table public.users
  add constraint users_id_auth_fkey
  foreign key (id) references auth.users (id) on delete cascade;
