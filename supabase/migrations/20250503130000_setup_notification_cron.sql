
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron job if it exists to avoid duplicates
SELECT cron.unschedule('check-message-notifications')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-message-notifications');

-- Schedule the notification check to run every 2 minutes for more reliability
SELECT cron.schedule(
  'check-message-notifications', -- name of the cron job
  '*/2 * * * *',                -- run every 2 minutes (more frequent than before)
  $$
  SELECT
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-message-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true}'::jsonb -- Add debug flag to get more detailed logs
    ) as request_id;
  $$
);

-- Also create a secondary more frequent check focused on critical messages that are very close to deadline
SELECT cron.schedule(
  'check-critical-message-notifications', -- name of the cron job
  '* * * * *',                -- run every minute for critical messages
  $$
  -- Create a temporary table to store message IDs that are close to their deadline
  WITH critical_messages AS (
    SELECT 
      mc.message_id
    FROM 
      public.message_conditions mc
    WHERE 
      mc.active = true 
      AND mc.condition_type = 'no_check_in'
      AND mc.last_checked IS NOT NULL
      AND (
        -- Within 5 minutes of deadline
        NOW() >= (mc.last_checked + (mc.hours_threshold * interval '1 hour') + (mc.minutes_threshold * interval '1 minute')) - interval '5 minutes'
        -- But not already past deadline by more than 5 minutes
        AND NOW() <= (mc.last_checked + (mc.hours_threshold * interval '1 hour') + (mc.minutes_threshold * interval '1 minute')) + interval '5 minutes'
      )
    LIMIT 5 -- Limit to avoid overloading
  )
  SELECT
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-message-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true, "emergency": true}'::jsonb
    ) as request_id
  FROM critical_messages
  LIMIT 1;
  $$
);

-- Run the notification check immediately once to catch any pending notifications
DO $$
BEGIN
  PERFORM
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-message-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true}'::jsonb
    );
END $$;
