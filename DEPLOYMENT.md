# Deployment

Cloudflare Pages project: `tai-console`.

- Connected GitHub repo: `LuuDinhTheTai/tAI`
- Production branch: `main`
- Framework: None (static site)
- Build command: empty
- Build output directory: `/`

Site: https://tai-console.pages.dev/

The UI starts in demo mode until configured with an actual Supabase backend. Only public Supabase client keys belong in browser code; Upload-Post and AI provider secrets stay in Supabase Edge Functions.
