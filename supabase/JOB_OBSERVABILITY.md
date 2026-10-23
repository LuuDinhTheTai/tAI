# tAI — Job observability and AI activity logging

## Goal

Show **what tAI is working on now** and **where a task stopped**: product selection, context, AI provider call, draft saved, content validation, Upload-Post handoff, reconciliation and analytics/memory updates.

Live dashboard:
- [Tổng quan](https://tai-console.pages.dev/#overview): most recent job with status, stage message and a link to the timeline.
- [Nhật ký hoạt động](https://tai-console.pages.dev/#logs): job cards, progress percentage, expandable event timelines, filters and errors. Polls Supabase every 30 seconds while this page is open; **not** a server-pushed WebSocket.
- [Supabase Edge Function Logs](https://supabase.com/dashboard/project/idovyelypzisdngfcecc/functions/tai-automation/logs): low-level runtime errors.

## Storage

`public.job_runs`: one row per execution, with `id`, `user_id`, `kind`, `trigger_source`, `status`, `stage`, `progress` (0–100), `message`, related product/post, started/updated/finished timestamps.

`public.job_logs`: event timeline with `job_run_id`, `stage`, `event_status`, `level`, event message, restricted details, and timestamp. Legacy records are kept and have `job_run_id = null`.

Both are **server-write-only**, with `SELECT` granted to `authenticated` under owner-scoped RLS. Anonymous clients cannot read job events. No API secrets, raw prompts, token contents or credentials are intentionally stored.

The frontend displays untrusted log text HTML-escaped.

## Covered activities

- Scheduled `agent-tick` / manually triggered agent: skipped/disabled/already-run, inventory selection, context, request to AI, AI response, draft persisted, validation, Upload-Post call, pending reconciliation, success or error.
- AI draft, manual publishing and manual reconciliation: each gets its own correlated job.
- Scheduled `agent-analyze`: scans processing posts, tries individual post analytics (records errors or unavailable stats rather than inventing zeros), fetches account analytics, saves agent memory, reports completion.
- Manual `profile-sync`: a tracked analytics job.
- Diagnostic `job-health`: writes a short sample job with 4 steps: **started (0%) → check_database (35%) → check_cron (75%) → completed (100%)**. Does not call AI or publish any Threads content.

## Interpretation and caveats

- A job's **progress percentage is an estimated workflow milestone**, not a measured fraction of model inference time. A long external API request can leave progress unchanged.
- `completed` on a publisher job means **the upload request was submitted to Upload-Post**, not necessarily posted successfully. Verify the post status separately via `get_status` / reconciliation.
- A `running` job older than 10 minutes gets a **"Có thể bị kẹt"** warning on the dashboard. Runtime interruptions may prevent a final job log; the last durable step identifies the suspected failure boundary.
- Existing jobs/events that predate the instrumentation cannot be reconstructed in detail. New executions are instrumented.
- A disabled agent records a skipped agent-cycle run when Cron invokes the scheduler, while no public content is published during a diagnostic check.
- Two scheduled jobs currently run at **10:10** and **19:20 Asia/Bangkok**. Data is also viewable when Cloudflare dashboard is closed.

## Verification

Verified on Supabase Edge Function v12+ with a server-side `job-health` request:
- Edge HTTP status 200.
- One `diagnostic` job marked `completed`, `progress = 100`.
- Four linked `job_logs` rows containing the expected stages.
- RLS: `anon` cannot SELECT `job_runs`; `authenticated` can read owner rows but cannot INSERT.

## Potential future enhancements

- Supabase Realtime for near-instant updates instead of 30-second polling.
- Alert on failed or stuck jobs, with daily digest and retention policy.
- Per-request provider latency/token/price accounting when those provider APIs return this information reliably. Avoid guessing token cost.
