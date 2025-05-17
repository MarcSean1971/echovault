
-- Optimize notification cron jobs to reduce server load
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron jobs if they exist to avoid duplicates
DO $$
BEGIN
    -- Try to unschedule the existing notification jobs
    BEGIN
        PERFORM cron.unschedule('check-message-notifications');
        RAISE NOTICE 'Successfully removed existing notification cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing notification cron job found, continuing...';
    END;
    
    -- Also remove the critical job if it exists
    BEGIN
        PERFORM cron.unschedule('check-critical-message-notifications');
        RAISE NOTICE 'Successfully removed existing critical notification cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing critical notification cron job found, continuing...';
    END;
END
$$;

-- Schedule the consolidated notification check to run every 5 minutes
-- This provides a good balance between responsiveness and server load
SELECT cron.schedule(
  'check-message-notifications', -- name of the cron job
  '*/5 * * * *',                 -- run every 5 minutes (reduced from every 2 minutes)
  $$
  SELECT
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-message-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true}'::jsonb -- Add debug flag to get more detailed logs
    ) as request_id;
  $$
);

-- Keep a separate more frequent check focused on critical messages that are very close to deadline
-- This ensures critical notifications still have quick response times
SELECT cron.schedule(
  'check-critical-message-notifications', -- name of the cron job
  '*/2 * * * *',                -- run every 2 minutes for critical messages
  $$
  -- Optimized query for critical messages to reduce database load
  -- Use WITH clause to materialize results once before main query
  WITH critical_messages AS (
    SELECT 
      mc.message_id
    FROM 
      public.message_conditions mc
    WHERE 
      mc.active = true 
      AND mc.condition_type = 'no_check_in'
      AND mc.last_checked IS NOT NULL
      -- Only look for conditions that are VERY close to deadline (within 10 minutes)
      AND (
        NOW() >= (mc.last_checked + (mc.hours_threshold * interval '1 hour') + (mc.minutes_threshold * interval '1 minute')) - interval '10 minutes'
        AND NOW() <= (mc.last_checked + (mc.hours_threshold * interval '1 hour') + (mc.minutes_threshold * interval '1 minute')) + interval '5 minutes'
      )
    -- Use index on active and condition_type
    LIMIT 3 -- Reduced limit to lower processing overhead
  )
  SELECT
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-message-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true, "emergency": true, "optimized": true}'::jsonb
    ) as request_id
  FROM critical_messages
  LIMIT 1;
  $$
);

-- Run the notification check once immediately
DO $$
BEGIN
  PERFORM
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-message-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true}'::jsonb
    );
    
  RAISE NOTICE 'Immediate notification check triggered';
END $$;
