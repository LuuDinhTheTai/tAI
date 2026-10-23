create table if not exists public.tai_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.tai_admins enable row level security;
revoke all on public.tai_admins from public, anon, authenticated;
comment on table public.tai_admins is 'Server-only authorization allowlist for privileged AI and publishing operations; no Data API role grants.';
-- For each deployment: grant access to the intended admin UUID using a private SQL Editor statement.
-- Do not insert untrusted users automatically or publish admin identity in source.
