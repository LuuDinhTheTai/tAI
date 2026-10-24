-- tAI AI Live Monitor: authenticated progress notifications, not public system logs.
-- Postgres Changes are sent only to clients permitted by each table's owner RLS.
-- No new anonymous rights or browser write permissions are granted.
do $$
declare name text;
begin
  foreach name in array array['job_runs','job_logs','posts'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime'
        and schemaname='public' and tablename=name
    ) then
      execute format('alter publication supabase_realtime add table public.%I',name);
    end if;
  end loop;
end $$;
