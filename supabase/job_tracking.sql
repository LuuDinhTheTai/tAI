-- Durable tAI job execution ledger + correlated step events.
-- Writes are server-only. Browser receives owner-scoped SELECT through Supabase Auth/RLS.
create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('agent_cycle','analytics_sync','diagnostic','manual_ai','manual_publish','reconcile')),
  trigger_source text not null check(trigger_source in ('cron','manual','system')),
  status text not null default 'running' check(status in ('running','completed','failed','skipped')),
  stage text not null default 'started' check (char_length(stage) between 1 and 80),
  progress smallint not null default 0 check(progress between 0 and 100),
  message text not null default '' check(char_length(message)<=1200),
  product_id uuid,
  post_id uuid,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  unique(id,user_id),
  constraint job_runs_product_owner_fk foreign key(product_id,user_id)
    references public.products(id,user_id) on delete set null(product_id),
  constraint job_runs_post_owner_fk foreign key(post_id,user_id)
    references public.posts(id,user_id) on delete set null(post_id),
  constraint job_runs_terminal_time_check check(status='running' or finished_at is not null)
);
create index if not exists job_runs_recent_idx
  on public.job_runs(user_id,started_at desc);
create index if not exists job_runs_active_idx
  on public.job_runs(user_id,status,started_at desc);
create index if not exists job_runs_product_fk_idx
  on public.job_runs(product_id,user_id) where product_id is not null;
create index if not exists job_runs_post_fk_idx
  on public.job_runs(post_id,user_id) where post_id is not null;
alter table public.job_runs enable row level security;
revoke all on public.job_runs from public,anon,authenticated;
grant select on public.job_runs to authenticated;
create policy job_runs_owner_read on public.job_runs for select to authenticated
  using(user_id=(select auth.uid()));

alter table public.job_logs
  add column if not exists job_run_id uuid,
  add column if not exists stage text,
  add column if not exists event_status text not null default 'event';
alter table public.job_logs
  add constraint job_logs_event_status_check
  check(event_status in ('event','started','progress','completed','failed','skipped'));
alter table public.job_logs
  add constraint job_logs_run_owner_fk
  foreign key(job_run_id,user_id)
  references public.job_runs(id,user_id) on delete set null(job_run_id);
create index if not exists job_logs_run_time_idx
  on public.job_logs(job_run_id,created_at asc) where job_run_id is not null;
comment on table public.job_runs is
  'A server-written execution for AI agent, analytics, manual tasks or diagnostics, with stage/progress/duration.';
comment on column public.job_logs.job_run_id is
  'Links structured audit step to one job run; legacy logs have null job_run_id.';
