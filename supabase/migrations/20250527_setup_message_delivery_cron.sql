
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing cron jobs for message processing
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname LIKE '%message%';

-- Create a cron job that runs every minute to process due messages
SELECT cron.schedule(
  'process-due-messages-every-minute',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/process-due-messages',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
        body:='{"source": "cron", "debug": true}'::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'process-due-messages-every-minute';
