# Supabase — tAI backend schema

Uses the Database Design skill (https://github.com/MoizIbnYousaf/ai-agent-skills/blob/main/skills/database-design/SKILL.md) and Supabase RLS guidance.

## Deployment

1. Create a **Free** Supabase project if eligible. Suggested region: Singapore (ap-southeast-1).
2. Apply `schema.sql` once using the SQL Editor on a **new empty project**, or as a tracked migration with the Supabase CLI. Do not re-run blindly: this version creates policies and triggers.
3. In Authentication, enable Email authentication, create/invite the intended admin account and disable open/public signup for a one-person dashboard.
4. Open tAI Console > Cài đặt and enter the Supabase Project URL and **publishable** key, then log in. No service-role key, secret key or Upload-Post key belongs in the frontend.
5. The dashboard will then load database-backed products, posts, settings and logs. AI publishing, scheduled jobs and Upload-Post integration require separate Edge Functions and secrets, which are not deployed by this schema.

## Data model

| Table | Purpose | Access via RLS |
|---|---|---|
| `products` | Affiliate items, prices, links, media metadata | Owner CRUD |
| `posts` | Content drafts, schedules, external IDs and metrics | Owner CRUD |
| `app_settings` | Non-secret prompt/model preferences | Owner read/write |
| `job_logs` | Publishing events and errors | Owner read only; server writes |

Post counters are intentionally denormalized for low-cost dashboard reads. Composite foreign keys protect cross-user references, and `upload_post_request_id` is unique to support idempotent publishing.

## Storage

Private bucket `product-media`; maximum 5 MiB per object; supported image types JPEG, PNG and WebP. Paths must begin with the owner's auth UUID, e.g. `USER_UUID/photo.webp`. For publishing via Upload-Post, the server should create short-lived signed URLs for required files, not expose the bucket publicly.

## Security and verification

- RLS policies scoped by `(select auth.uid())` on every public app table.
- `anon` has no privileges on application tables.
- `authenticated` can read/write only their own rows; job logs are read-only to user clients.
- No service-role or AI API key is kept in `app_settings`. Use Edge Function secrets for those credentials.
- `app_private.touch_updated_at` is outside exposed schemas and does not use SECURITY DEFINER.
- Test owner-vs-owner access with two independent authenticated sessions, and run Supabase Security/Performance Advisors after migration.

Example verification SQL (run from SQL Editor):

```sql
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('products','posts','app_settings','job_logs');

select schemaname, tablename, policyname, cmd from pg_policies
where schemaname in ('public','storage')
  and tablename in ('products','posts','app_settings','job_logs','objects');

select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id='product-media';
```

SQL Editor usually runs with elevated privileges and cannot by itself demonstrate tenant isolation. Test RLS via Auth/REST requests as well.

## Next backend tasks

Deploy Edge Functions for AI-provider fallback, prompt validation, Upload-Post Hosted MCP publishing and metrics sync, then configure Supabase Cron with an authenticated internal invocation. Restrict deduplication and retries; never allow browser clients to publish using private credentials.
