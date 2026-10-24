-- Reconcile only pending/paused Threads posts with an existing Upload-Post request_id.
-- No AI model invocation or new social media publication.
-- Schedule: every 30 minutes UTC; fires twice per hour.
-- The secret is read from encrypted Supabase Vault at execution time.
select cron.schedule('tai-threads-reconcile', '*/30 * * * *', $cron$
  select net.http_post(
    url := 'https://idovyelypzisdngfcecc.supabase.co/functions/v1/tai-automation',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','sb_publishable_kaFpG58YI0SNa-8gfWcqFw_s2HmLEip',
      'x-tai-cron',(select decrypted_secret from vault.decrypted_secrets where name='tai_cron_token')
    ),
    body := '{"action":"agent-reconcile"}'::jsonb,
    timeout_milliseconds := 16000
  );
$cron$);
