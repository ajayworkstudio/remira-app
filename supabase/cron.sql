-- ============================================================
-- OPTIONAL: run the notification dispatcher every minute from
-- Supabase itself (pg_cron + pg_net). Works on the free tier.
--
-- 1. Dashboard → Database → Extensions: enable pg_cron and pg_net
-- 2. Replace the two placeholders below, then run this once.
--    (Use the same CRON_SECRET you set in Vercel.)
-- To stop:  select cron.unschedule('remira-dispatch');
-- ============================================================
select cron.schedule(
  'remira-dispatch',
  '* * * * *',
  $$
  select net.http_post(
    url     := 'https://YOUR-APP.vercel.app/api/notifications/dispatch',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'),
    body    := '{}'::jsonb
  );
  $$
);
