-- Auto-discover Shopee Affiliate offers at 08:30 Vietnam time (01:30 UTC).
-- Will process only users who explicitly enabled shopee_enabled.
-- Secret is read directly from Supabase Vault; no credential is checked into Github.
select cron.schedule('tai-shopee-discovery', '30 1 * * *', $cron$
  select net.http_post(
    url := 'https://idovyelypzisdngfcecc.supabase.co/functions/v1/tai-automation',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','sb_publishable_kaFpG58YI0SNa-8gfWcqFw_s2HmLEip',
      'x-tai-cron',(select decrypted_secret from vault.decrypted_secrets where name='tai_cron_token')
    ),
    body := '{"action":"shopee-discover"}'::jsonb,
    timeout_milliseconds := 90000
  );
$cron$);
-- Owner-only Realtime notifications for newly verified Shopee opportunities.
do $$begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
  and schemaname='public' and tablename='shopee_opportunities') then
   alter publication supabase_realtime add table public.shopee_opportunities;
 end if;
end $$;
