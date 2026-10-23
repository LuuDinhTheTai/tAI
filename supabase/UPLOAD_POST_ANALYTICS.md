# Upload-Post → tAI Threads Analytics

## Data source and ownership

Connected Upload-Post profile: `default`; platform: Threads. A server-side action now queries:

- `get_analytics({profileUsername:"default",platforms:["threads"]})`: profile followers and account-level metrics. The provider does not guarantee a time window for the aggregate `impressions`, so **do not** label that value as impressions of a single post.
- `get_total_impressions({profileUsername:"default",period:"last_week",platforms:["threads"]})`: impressions over an explicit `start_date` to `end_date` period.
- `get_post_analytics({requestId})`: per-post metrics. On the known test Threads post, Upload-Post returns `Threads API error (HTTP 400)`; this **does not** mean 0 views or 0 engagement. The adapter skips unavailable per-post metrics rather than copying profile totals into individual post counters.

Current initial profile snapshot: **12 followers**, **12 account aggregate impressions** (period unspecified), **12 impressions for 2026-10-16 to 2026-10-23**, **0 reported account likes/comments/shares/clicks**. These are values returned by Upload-Post and may change on later syncs. We did not infer reach, conversions or revenue.

## Database

Table: `public.social_profile_snapshots` (RLS owner SELECT, server-only writes). Unique per UTC day, profile and platform. Owner cannot modify or fake the metrics via the browser. Stored columns include followers, account impressions (unspecified period), weekly impressions with dates, likes, comments, shares, quotes, clicks, profile views, reach and fetched time.

Each daily `agent-analyze` cron invocation updates the snapshot and persists summary to `agent_memory.metrics.threads_profile`, when the provider returns it. A failure to read account-level analytics is recorded as a warning; it does not overwrite a previously saved snapshot with guessed zeros.

## Dashboard

Open https://tai-console.pages.dev/#analytics after signing in. The new "Upload-Post · Threads" section displays account followers, 7-day impressions, account likes and account link clicks; it also shows the reporting dates and freshness.

Press **Đồng bộ Upload-Post** to request a new snapshot immediately through the admin-protected Supabase Edge Function `tai-automation`, action `profile-sync`. The Edge Function validates the signed-in user's JWT and admin allowlist. No API key is sent to the browser.

Daily server schedule: `tai-daily-analytics`, **19:20 Asia/Bangkok** (12:20 UTC), already present as a Supabase Cron job.

## Troubleshooting

- If manual refresh returns an error, check Supabase Edge Functions → `tai-automation` → Logs; the browser displays the error without exposing API secrets.
- Ensure the project has `UPLOAD_POST_API_KEY` in Supabase Secrets and the Threads account remains connected to the `default` profile.
- Per-post metrics for the known test post are currently unavailable from Threads through Upload-Post, despite successful publishing. Do not treat an empty per-post metrics response as zero views.
- Do not add the profile's impressions to `posts.views`: it would double count and misattribute metrics.
