
-- Optimize cron jobs to reduce server load
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron jobs if they exist to avoid duplicates
DO $$
BEGIN
    -- Try to unschedule the existing jobs
    BEGIN
        PERFORM cron.unschedule('send-message-reminders-every-minute');
        RAISE NOTICE 'Successfully removed existing minute-based cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing minute-based cron job found, continuing...';
    END;
    
    -- Also try to unschedule the older 15-min job if it exists
    BEGIN
        PERFORM cron.unschedule('send-message-reminders-15min');
        RAISE NOTICE 'Successfully removed existing 15-min cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing 15-min cron job found, continuing...';
    END;
END
$$;

-- Schedule the send-reminder-emails function to run EVERY 15 MINUTES instead of every minute
-- This significantly reduces database load while still providing timely reminders
DO $$
DECLARE
  http_request text;
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables WHERE schemaname = 'cron' AND tablename = 'job'
    ) THEN
        http_request := 
          'SELECT
            net.http_post(
              url:=''https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails'',
              headers:=''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}''::jsonb,
              body:=''{"debug": true}''::jsonb
            ) as request_id;';
            
        PERFORM cron.schedule(
          'send-message-reminders-15min', -- Changed name to reflect new schedule
          '*/15 * * * *', -- Run every 15 minutes instead of every minute
          http_request
        );
        
        RAISE NOTICE 'Successfully scheduled optimized reminder cron job to run every 15 minutes';
    ELSE
        RAISE NOTICE 'pg_cron extension tables not found, skipping cron job creation';
    END IF;
END
$$;

-- Run the reminder check once immediately to ensure everything is working
DO $$
BEGIN
  PERFORM
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true, "forceSend": false}'::jsonb
    );
    
  RAISE NOTICE 'Immediate reminder check triggered';
END $$;
