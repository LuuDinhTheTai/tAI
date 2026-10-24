# tAI React + Vite + TypeScript migration
This branch replaces the legacy vanilla-JavaScript frontend with React 18, Vite 5 and strict TypeScript.

## Design references
- [Dashboard Designer](https://github.com/xcrrr/claude-skills/blob/main/skills/data/dashboard-designer/SKILL.md): decision-first KPI hierarchy, clear provenance, restrained palette, actionable drill-down, responsive layout.
- [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md): accessible focus, 44px touch targets, form feedback, color contrast, reduced motion, responsive navigation, no decorative emojis.

## Features preserved
- Supabase Auth + RLS, including one-time legacy session migration.
- Owner-scoped tables: posts, products, app_settings, job_runs, job_logs, agent_runs, social_profile_snapshots.
- Real-time AI workflow via Supabase Realtime subscriptions.
- Gemini/Groq content requests and Threads publishing only through secured Supabase Edge Function.
- Live publishing confirmation and Upload-Post account-level analytics.
- Hash routes `#overview`, `#live`, `#posts`, `#products`, `#analytics`, `#automation`, `#settings`; legacy `#logs` redirects to live page.

## Hosting
- Command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite / static assets
- No new paid Cloudflare services are necessary.
- Supabase URL and publishable key are public client configuration only.
- Never put service_role, Upload-Post tokens, or AI provider secrets into Vite env variables.

## Validations
Run `npm install && npm run build` in a Node >=18 environment.
A successfully built Cloudflare preview should be manually smoke-tested with a signed-in owner session before merging into main.
Production backend, Cron and Posts are unchanged by this migration.
