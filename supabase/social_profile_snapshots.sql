-- tAI profile snapshots: source Upload-Post, not per-post Threads metrics.
create table if not exists public.social_profile_snapshots (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 platform text not null check(platform in ('threads')),
 profile_username text not null check(char_length(profile_username) between 1 and 80),
 snapshot_date date not null default (now() at time zone 'utc')::date,
 followers bigint check(followers>=0),
 account_impressions bigint check(account_impressions>=0),
 weekly_impressions bigint check(weekly_impressions>=0),
 week_start date, week_end date,
 likes bigint check(likes>=0), comments bigint check(comments>=0),
 shares bigint check(shares>=0), quotes bigint check(quotes>=0),
 clicks bigint check(clicks>=0), profile_views bigint check(profile_views>=0),
 reach bigint check(reach>=0),
 source text not null default 'upload-post' check(source='upload-post'),
 fetched_at timestamptz not null default now(),
 unique(user_id,platform,profile_username,snapshot_date),
 constraint snapshots_date_range check(week_start is null or week_end is null or week_start<=week_end)
);
create index if not exists social_profile_snapshots_recent_idx
 on public.social_profile_snapshots(user_id,snapshot_date desc);
alter table public.social_profile_snapshots enable row level security;
revoke all on public.social_profile_snapshots from public,anon,authenticated;
grant select on public.social_profile_snapshots to authenticated;
create policy social_profile_snapshots_owner_select on public.social_profile_snapshots for select to authenticated
 using (user_id=(select auth.uid()));
comment on column public.social_profile_snapshots.account_impressions is
 'Upload-Post get_analytics profile aggregate. Reporting period is not guaranteed.';
comment on column public.social_profile_snapshots.weekly_impressions is
 'Upload-Post get_total_impressions last_week, period in week_start/end.';
