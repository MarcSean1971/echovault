
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron job if it exists to avoid duplicates
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'cron' AND tablename = 'job'
    ) THEN
        SELECT cron.unschedule('send-message-reminders-15min');
    END IF;
END
$$;

-- Schedule the send-reminder-emails function to run every 15 minutes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'cron' AND tablename = 'job'
    ) THEN
        PERFORM cron.schedule(
          'send-message-reminders-15min',
          '*/15 * * * *', -- Run every 15 minutes (at 0, 15, 30, 45 minutes of each hour)
          $$
          SELECT
            net.http_post(
              url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
              body:='{}'::jsonb
            ) as request_id;
          $$
        );
    ELSE
        RAISE NOTICE 'pg_cron extension tables not found, skipping cron job creation';
    END IF;
END
$$;

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
