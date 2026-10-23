-- Times in UTC: 03:10 = 10:10 Asia/Bangkok, 12:20 = 19:20 Asia/Bangkok.
-- Agent settings in app_settings control enabling and publication mode.
select cron.schedule('tai-daily-agent', '10 3 * * *', $cron$
   select net.http_post(
     url := 'https://idovyelypzisdngfcecc.supabase.co/functions/v1/tai-automation',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'apikey', 'sb_publishable_kaFpG58YI0SNa-8gfWcqFw_s2HmLEip',
       'x-tai-cron', (select decrypted_secret from vault.decrypted_secrets where name='tai_cron_token')
     ),
     body := '{"action":"agent-tick"}'::jsonb,
     timeout_milliseconds := 12000
   );
 $cron$);
select cron.schedule('tai-daily-analytics', '20 12 * * *', $cron$
   select net.http_post(
     url := 'https://idovyelypzisdngfcecc.supabase.co/functions/v1/tai-automation',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'apikey', 'sb_publishable_kaFpG58YI0SNa-8gfWcqFw_s2HmLEip',
       'x-tai-cron', (select decrypted_secret from vault.decrypted_secrets where name='tai_cron_token')
     ),
     body := '{"action":"agent-analyze"}'::jsonb,
     timeout_milliseconds := 12000
   );
 $cron$);
