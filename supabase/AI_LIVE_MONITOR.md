# tAI AI Live Monitor

The dashboard route [**AI trực tiếp**](https://tai-console.pages.dev/#live) displays the **observable workflow stages** of the AI Agent. It is not a Supabase technical log viewer and does not expose Gemini/Groq chain-of-thought or token-by-token generation.

## Observed steps

1. Scan and select an active product from the database.
2. Read previous post context.
3. Start a Gemini/Groq generation request, then record the response when it arrives.
4. Save a draft.
5. Validate disclosure, character length and affiliate link.
6. Submit the draft to Upload-Post if auto-publishing is enabled.
7. Observe the confirmed Threads status when `posts.status` changes.

Steps are recorded by the Edge Function in `job_runs` and `job_logs`; asynchronous posting confirmation updates `posts`. Progress percentages are backend milestones, **not a measurement of hidden model reasoning**. A job can reach 100% after submitting a post while Threads confirmation remains pending.

## Transport

The page uses a **native WebSocket** implementing the Supabase Realtime protocol 1.0.0. No React, Vue, framework, CDN or third-party dependency is necessary.

- Authenticated channel: `realtime:ai-progress-<user_id>`, includes the signed-in Supabase JWT in its join payload.
- Subscribes only to authorized `job_runs` INSERT/UPDATE, `job_logs` INSERT and `posts` UPDATE for its `user_id`.
- RLS enforces owner-only `SELECT`; `anon` has no read permission and clients have no write permission to job tables.
- Supabase publication changes: `supabase/ai_live_realtime.sql`.
- Heartbeat every 20 seconds; reconnect after disconnect. The connection is shut down when leaving the Live Monitor or hiding the browser tab.
- Refreshes the Realtime JWT when the existing dashboard session is renewed.
- REST queries bootstrap the initial page and provide a fallback / missed-event recovery every 30 seconds. A visible connection badge distinguishes push notifications from fallback operation.

## Using the monitor

1. Sign in to https://tai-console.pages.dev/.
2. Open **AI trực tiếp** (direct link: https://tai-console.pages.dev/#live).
3. See the most recent AI run and its observed stage transitions. New runs automatically become the main view unless an older run has been selected manually.
4. Click another recent run to inspect its stored workflow history.
5. If nothing is currently running, the last completed run remains available. The autonomous creation schedule is 10:10 each day (Asia/Bangkok).

Historical jobs do not include details that were never logged. The UI cannot expose a model's internal deliberations. For generated text previews, inspect the saved draft/post in **Bài đăng**, after the AI response has been stored. A future optional AI streaming endpoint could expose partial response text, but that would be **generated output**, not internal thought, and has not been implemented.

## Test status

- Postgres publications verified for `job_runs`, `job_logs` and `posts`.
- JavaScript syntax and simulated realtime record handling passed; HTML escaping of stage messages verified.
- Real browser WebSocket subscription cannot be confirmed through the deployment tools alone. Use the connection badge on the Live Monitor; if it shows fallback, inspect browser network WebSocket and Supabase Realtime configuration.
