
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the notification check to run every 5 minutes
SELECT cron.schedule(
  'check-message-notifications', -- name of the cron job
  '*/5 * * * *',                -- run every 5 minutes
  $$
  SELECT
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-message-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
