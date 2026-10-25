-- Shopee Affiliate Discovery pipeline. Server writes only; browser owners read under RLS.
create table if not exists public.shopee_opportunities(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 external_id text not null check(char_length(external_id) between 1 and 120),
 product_name text not null check(char_length(product_name) between 1 and 300),
 keyword text not null default '',
 product_url text,
 offer_url text,
 affiliate_url text,
 price_vnd numeric(16,2) check(price_vnd is null or price_vnd >= 0),
 commission_rate numeric(7,6) check(commission_rate is null or commission_rate between 0 and 1),
 sales bigint check(sales is null or sales >= 0),
 rating numeric(4,2) check(rating is null or rating between 0 and 5),
 score integer not null default 0 check(score between 0 and 100),
 shop_name text,
 status text not null default 'discovered' check(status in ('discovered','linked','imported','rejected')),
 source text not null default 'shopee-affiliate-api' check(source='shopee-affiliate-api'),
 product_id uuid,
 fetched_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,external_id),
 constraint shopee_offer_product_owner foreign key(product_id,user_id) references public.products(id,user_id) on delete set null(product_id)
);
create index if not exists shopee_opportunities_owner_score_idx on public.shopee_opportunities(user_id,score desc,fetched_at desc);
create index if not exists shopee_opportunities_product_fk_idx on public.shopee_opportunities(product_id,user_id) where product_id is not null;
alter table public.shopee_opportunities enable row level security;
revoke all on public.shopee_opportunities from public,anon,authenticated;
grant select on public.shopee_opportunities to authenticated;
create policy shopee_opportunities_owner_read on public.shopee_opportunities for select to authenticated
 using(user_id=(select auth.uid()));
-- Track discovery as a distinct job with no changes to existing job data.
alter table public.job_runs drop constraint if exists job_runs_kind_check;
alter table public.job_runs add constraint job_runs_kind_check
 check(kind in ('agent_cycle','analytics_sync','diagnostic','manual_ai','manual_publish','reconcile','shopee_discovery'));
comment on table public.shopee_opportunities is 'Read-only owner-scoped Shopee Affiliate API offer inventory; affiliate_url only accepted from verified short-link mutation';
