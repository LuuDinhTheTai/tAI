-- tAI v1 / Supabase PostgreSQL bootstrap (run once on an empty project).
-- Database design: normalized relational entities, explicit ownership, FK integrity, indexed access paths.
-- Supabase security: auth.uid() RLS, private object storage, least-privilege grants.
begin;

create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create or replace function app_private.touch_updated_at()
returns trigger language plpgsql set search_path = pg_catalog
as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function app_private.touch_updated_at() from public, anon, authenticated;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text not null default '',
  category text not null default '',
  price numeric(14,2) not null default 0 check (price >= 0),
  currency text not null default 'VND' check (currency ~ '^[A-Z]{3}$'),
  affiliate_url text not null default '',
  image_path text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid,
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  status text not null default 'draft'
    check (status in ('draft','scheduled','processing','published','failed','paused')),
  provider text not null default 'Manual',
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  replies bigint not null default 0 check (replies >= 0),
  reposts bigint not null default 0 check (reposts >= 0),
  scheduled_at timestamptz,
  published_at timestamptz,
  upload_post_request_id text,
  upload_post_job_id text,
  threads_post_id text,
  last_error text,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_product_owner_fk foreign key (product_id,user_id)
    references public.products(id,user_id) on delete set null (product_id),
  constraint posts_owner_reference_unique unique (id,user_id)
);

create table if not exists public.app_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid,
  event text not null check (char_length(btrim(event)) between 1 and 2000),
  level text not null default 'info' check (level in ('info','warning','error')),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now(),
  constraint logs_post_owner_fk foreign key (post_id,user_id)
    references public.posts(id,user_id) on delete set null (post_id)
);

create index if not exists posts_owner_created_idx on public.posts(user_id,created_at desc);
create index if not exists posts_owner_queue_idx on public.posts(user_id,status,scheduled_at);
create index if not exists posts_owner_published_idx on public.posts(user_id,published_at desc)
  where status = 'published';
create unique index if not exists posts_upload_post_request_uidx on public.posts(upload_post_request_id)
  where upload_post_request_id is not null;
create index if not exists products_owner_created_idx on public.products(user_id,created_at desc);
create index if not exists job_logs_owner_created_idx on public.job_logs(user_id,created_at desc);

create trigger products_updated_at before update on public.products
  for each row execute function app_private.touch_updated_at();
create trigger posts_updated_at before update on public.posts
  for each row execute function app_private.touch_updated_at();
create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function app_private.touch_updated_at();

alter table public.products enable row level security;
alter table public.posts enable row level security;
alter table public.app_settings enable row level security;
alter table public.job_logs enable row level security;

revoke all on table public.products, public.posts, public.app_settings, public.job_logs from anon;
revoke all on table public.products, public.posts, public.app_settings, public.job_logs from authenticated;
grant select,insert,update,delete on public.products, public.posts to authenticated;
grant select,insert,update on public.app_settings to authenticated;
grant select on public.job_logs to authenticated;

create policy products_select_own on public.products for select to authenticated
  using (user_id = (select auth.uid()));
create policy products_insert_own on public.products for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy products_update_own on public.products for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy products_delete_own on public.products for delete to authenticated
  using (user_id = (select auth.uid()));

create policy posts_select_own on public.posts for select to authenticated
  using (user_id = (select auth.uid()));
create policy posts_insert_own on public.posts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy posts_update_own on public.posts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy posts_delete_own on public.posts for delete to authenticated
  using (user_id = (select auth.uid()));

create policy app_settings_select_own on public.app_settings for select to authenticated
  using (user_id = (select auth.uid()));
create policy app_settings_insert_own on public.app_settings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy app_settings_update_own on public.app_settings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Server-only writes for logs; per-owner SELECT for the frontend.
create policy job_logs_select_own on public.job_logs for select to authenticated
  using (user_id = (select auth.uid()));

-- Private bucket for photos referenced by product.image_path.
-- Required object path prefix: <auth.uid()>/filename.webp.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-media','product-media',false,5242880,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy tai_media_select_own on storage.objects for select to authenticated
  using (bucket_id='product-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy tai_media_insert_own on storage.objects for insert to authenticated
  with check (bucket_id='product-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy tai_media_update_own on storage.objects for update to authenticated
  using (bucket_id='product-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id='product-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy tai_media_delete_own on storage.objects for delete to authenticated
  using (bucket_id='product-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
