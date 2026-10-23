-- tAI autonomous v1. State is durable; browser sessions are not required.
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_date date not null,
  mode text not null check (mode in ('draft','publish')),
  status text not null default 'running' check (status in ('running','completed','failed','skipped')),
  product_id uuid,
  post_id uuid,
  note text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique(user_id,slot_date),
  constraint agent_run_product_owner_fk foreign key(product_id,user_id)
    references public.products(id,user_id) on delete set null(product_id),
  constraint agent_run_post_owner_fk foreign key(post_id,user_id)
    references public.posts(id,user_id) on delete set null(post_id)
);
create index if not exists agent_runs_owner_started_idx
  on public.agent_runs(user_id,started_at desc);
create index if not exists agent_runs_product_owner_idx
  on public.agent_runs(product_id,user_id) where product_id is not null;
create index if not exists agent_runs_post_owner_idx
  on public.agent_runs(post_id,user_id) where post_id is not null;
alter table public.agent_runs enable row level security;
revoke all on public.agent_runs from public,anon,authenticated;
grant select on public.agent_runs to authenticated;
create policy agent_runs_owner_read on public.agent_runs for select to authenticated
  using(user_id=(select auth.uid()));

create table if not exists public.agent_memory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb check(jsonb_typeof(preferences)='object'),
  metrics jsonb not null default '{}'::jsonb check(jsonb_typeof(metrics)='object'),
  updated_at timestamptz not null default now()
);
alter table public.agent_memory enable row level security;
revoke all on public.agent_memory from public,anon,authenticated;
grant select on public.agent_memory to authenticated;
create policy agent_memory_owner_read on public.agent_memory for select to authenticated
  using(user_id=(select auth.uid()));

-- A random long-lived scheduler secret is encrypted in Vault, never stored in source.
-- The Edge Function verifies its SHA-256 against the server-only table.
create table if not exists public.tai_scheduler_auth(
  id smallint primary key check (id=1),
  secret_sha256 text not null check (secret_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
alter table public.tai_scheduler_auth enable row level security;
revoke all on public.tai_scheduler_auth from public,anon,authenticated;
create policy tai_scheduler_auth_client_deny on public.tai_scheduler_auth
  for select to anon,authenticated using(false);
do $$
declare token text;
begin
  if not exists (select 1 from public.tai_scheduler_auth where id=1) then
    token:=encode(extensions.gen_random_bytes(32),'hex');
    perform vault.create_secret(token,'tai_cron_token','tAI scheduled Edge Function authentication');
    insert into public.tai_scheduler_auth(id,secret_sha256)
    values (1,encode(extensions.digest(token,'sha256'),'hex'));
  end if;
end $$;
