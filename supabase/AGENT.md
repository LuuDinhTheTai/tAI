# tAI Autonomous Agent — Operational Guide

## Status and scope

The Supabase Edge Function `tai-automation` now includes a durable autonomous cycle. The frontend is still HTML/CSS/JavaScript with no framework. The scheduler runs in Supabase independent of a logged-in browser.

**Currently enabled: `agent_enabled=true`, `agent_mode=draft`, `daily_limit=1`, `auto_publish=false`, `require_review=true`.** This is autonomous draft preparation, not unattended publication.

## Schedule (UTC / Asia-Bangkok)

- `tai-daily-agent`: `10 3 * * *` UTC = 10:10 Bangkok. Picks a safe active product, consults recent posts and any performance data, generates one draft and records a run.
- `tai-daily-analytics`: `20 12 * * *` UTC = 19:20 Bangkok. Reconciles in-flight Upload-Post submissions, tries to refresh post metrics, persists aggregated observations as memory.

Both jobs are installed via `supabase/agent_cron.sql` and run through `pg_cron` + `pg_net`. A 256-bit key is generated inside the database, encrypted in Supabase Vault, and verified against a server-only SHA-256 digest. The scheduler token itself is not committed to GitHub.

## What the agent actually does

1. Reads `app_settings` and an admin allowlist.
2. Claims a unique `(user_id, UTC day)` `agent_runs` record. Duplicate attempts do not call AI a second time.
3. Selects from **already entered** `products`. Ignores test/demo products, HTTP affiliate links and unsafe local/example domains.
4. Prefers less-repeated products and lightly weights real stored engagement, avoiding recently used openings.
5. Calls Gemini with Groq fallback, validates final content for the Threads limit and affiliate disclosure, and saves a draft.
6. In `draft` mode, stops here. In `publish` mode, publishing occurs **only** if `auto_publish=true` and `require_review=false`; failed or ambiguous Upload-Post responses pause the item instead of blindly retrying.
7. Daily analytics asks Upload-Post for eligible post metrics and records `agent_memory.metrics`. Missing/failed metrics are never invented.

AI attempts are hard-capped at **one autonomous draft per UTC day per configured admin**, even if the dashboard limit is set higher. Models or external API plans may still incur charges; the code does not guarantee a $0 bill.

## Dashboard controls

Open https://tai-console.pages.dev/#automation and sign in:

- **Cho phép agent tự chạy** turns the autonomous agent on/off.
- **Chế độ**: “Tạo nháp” (recommended) or “Tự đăng Threads”.
- Enabling automatic public posting requires selecting publish mode, enabling **Tự động xuất bản**, disabling **Duyệt bài trước khi đăng**, and confirming the warning.
- **Chạy agent ngay** tests the current day's cycle, subject to the once-per-day lock.

Logs: https://tai-console.pages.dev/#logs

## Important prerequisites / known limits

- The product catalog currently holds only demo/test URLs; consequently the agent safely reports `no_safe_products` until you add a legitimate HTTPS affiliate product.
- The first Upload-Post test submission had actually been published despite a local `paused` state. Its database record was reconciled using confirmed Upload-Post history and IDs. Review the public test post and remove it manually if inappropriate.
- Upload-Post may report a Threads analytics HTTP 400, so metric-based adaptation is limited to values actually returned. Earnings, affiliate conversions and product discovery from marketplaces are **not** connected.
- No automatic account signup, no unsanctioned key scraping, and no public test-product posting.
- To stop immediately without touching code: uncheck agent_enabled and save; alternatively disable the `tai-daily-agent` cron job in Supabase.
- Keep `UPLOAD_POST_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` in Supabase Secrets only. Protect Vault and service_role. Never expose them in the browser.

## Deployment validation

- Inspect `cron.job` for the two active jobs.
- Review `public.agent_runs`, `public.agent_memory`, `public.job_logs` with your authenticated session.
- Inspect `net._http_response` and `function_logs` as the admin for errors.
- Verify `tai_scheduler_auth` and `tai_admins` are inaccessible to `anon` and `authenticated`.
- A smoke test was performed through `net.http_post`: server returned 200 and created a `skipped/no_safe_products` run. This proves Cron credentials and the scheduler route; real generation/autopublishing remains untested without a genuine product.
