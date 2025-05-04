
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron job if it exists to avoid duplicates
SELECT cron.unschedule('send-message-reminders-hourly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-message-reminders-hourly');

-- Schedule the send-reminder-emails function to run every hour
SELECT cron.schedule(
  'send-message-reminders-hourly',
  '0 * * * *', -- Run at minute 0 of every hour (hourly)
  $$
  SELECT
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Run the reminder check immediately once to catch any pending reminders
DO $$
BEGIN
  PERFORM
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{}'::jsonb
    );
END $$;
