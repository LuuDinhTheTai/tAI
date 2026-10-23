# tAI automation backend (Supabase Edge Function)

Edge Function: `tai-automation` (currently deployed); source: [index.ts](functions/tai-automation/index.ts).

## Implemented

- Admin-only POST endpoint, enforced by **live Supabase Auth token validation** and a server-only `public.tai_admins` allowlist with RLS denying all client roles.
- Actions: `status`, `generate` (AI draft only), `publish` (explicitly confirmed), `reconcile` (poll Upload-Post result).
- Gemini/Groq provider fallback according to dashboard `model` setting.
- Official hosted Upload-Post MCP `https://mcp.upload-post.com/mcp` using per-request `Authorization: ApiKey ...`.
- One Upload-Post profile `default` connected to Threads at integration-inspection time. Can override via `UPLOAD_POST_PROFILE`.
- Publishing is **review-first**. No Cron jobs or automatic publication have been enabled yet. Never auto-retry a potentially published request.

## Required Supabase Edge Function Secrets

Visit [Supabase Edge Function Secrets](https://supabase.com/docs/guides/functions/secrets) and add these names (values from providers, **not from ChatGPT**):

| Secret | Required for | Where |
|---|---|---|
| `GEMINI_API_KEY` | Gemini AI generation | https://aistudio.google.com/apikey |
| `GROQ_API_KEY` | Groq AI generation / fallback | https://console.groq.com/keys |
| `UPLOAD_POST_API_KEY` | MCP upload_text / get_status | Upload-Post dashboard > API Keys |
| `UPLOAD_POST_PROFILE` | Profile name | Optional; default: `default` |
| `GEMINI_MODEL`, `GROQ_MODEL` | Model overrides | Optional, checked against provider catalog |

The function needs **at least one** AI provider key to generate. To publish, the Upload-Post key is required. Keep all tokens in Supabase Secrets. Do not paste them into public GitHub files, dashboard settings, screenshots or chats.

Supabase automatically injects its own `SUPABASE_URL`, publishable and server secret keys into Edge Functions; no need to re-create them. The function does not give the server secret to any browser. Never put an `sb_secret_...` or `service_role` key in JavaScript.

## User flow

1. Sign in to [tAI Console](https://tai-console.pages.dev/) via Supabase Auth.
2. Add an active product with a valid affiliate link.
3. Go to Bài đăng → AI tạo nháp. Generated text is saved as `draft`, not published.
4. Review the post and disclosure. Select **Đăng Threads** and explicitly confirm.
5. Post status becomes `processing` while Upload-Post completes it. Use **Đối soát** to fetch verified final status.
6. If remote submission outcome is uncertain, the post becomes `paused` to prevent silent duplicate publication.

### Endpoint contract

`POST https://idovyelypzisdngfcecc.supabase.co/functions/v1/tai-automation`

Headers: `apikey: <public publishable key>`, `Authorization: Bearer <signed-in user's access token>`, `Content-Type: application/json`.

Request bodies:

```json
{"action":"status"}
```
```json
{"action":"generate","productId":"<product UUID>"}
```
```json
{"action":"publish","postId":"<draft UUID>","confirm":true}
```
```json
{"action":"reconcile","postId":"<post UUID>"}
```

The function is deployed with gateway `verify_jwt=false` **only because it independently validates the token against Supabase Auth and checks the admin allowlist before every action**. Do not remove this code-level validation.

## Auth

The existing verified account has been added to `tai_admins` in the live database. The allowlist deliberately has zero grants to `anon` and `authenticated` roles, and an explicit deny policy, so clients cannot list members. If provisioning a NEW project, create the designated user with Supabase Auth first, then manually grant the correct UUID from private SQL; do not seed anonymous signups into admin.

Enable **Leaked Password Protection** in Supabase Auth > Security and Protection if available on the organization's plan. The Security Advisor currently flags it as disabled: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Safety and current limits

- MCP provider connection in ChatGPT is separate from backend service credentials; the Supabase function needs its own Upload-Post API key.
- This has been deployed and statically syntax-checked. Real AI generation, login, publish and reconciliation cannot be end-to-end tested before provider keys and an interactive user session are configured.
- Analytics sync and autonomous Supabase Cron are **not yet implemented**. Current dashboard metrics read stored values, not new live insights.
- The Upload-Post free plan may impose a low monthly upload quota; monitor actual plan limits before automating volume.
- GitHub -> Cloudflare Pages auto-deployment is enabled for `main`.
