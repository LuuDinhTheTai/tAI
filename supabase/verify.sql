-- tAI non-destructive smoke checks; use after applying schema.sql.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('products','posts','app_settings','job_logs')
order by c.relname;

select schemaname,tablename,policyname,cmd
from pg_policies where (schemaname='public' and tablename in ('products','posts','app_settings','job_logs'))
or (schemaname='storage' and tablename='objects' and policyname like 'tai_media_%')
order by schemaname,tablename,policyname;

select id,public,file_size_limit,allowed_mime_types
from storage.buckets where id='product-media';

select table_name, privilege_type, grantee
from information_schema.role_table_grants
where table_schema='public' and table_name in ('products','posts','app_settings','job_logs')
  and grantee in ('anon','authenticated')
order by table_name,grantee,privilege_type;
