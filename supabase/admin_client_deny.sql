-- RLS defense in depth: no public or authenticated user may list tAI admin allowlist.
-- Only trusted Edge Functions using a server-side key may inspect it.
create policy tai_admins_explicit_deny on public.tai_admins for select to anon, authenticated using (false);
