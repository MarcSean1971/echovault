
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron job if it exists to avoid duplicates
DO $$
BEGIN
    -- Try to unschedule the job, but don't error if it doesn't exist
    BEGIN
        PERFORM cron.unschedule('send-message-reminders-15min');
        RAISE NOTICE 'Successfully removed existing cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing cron job found with name send-message-reminders-15min, continuing...';
    END;
    
    -- Also try to unschedule the new job name if it exists (to avoid duplicates)
    BEGIN
        PERFORM cron.unschedule('send-message-reminders-every-minute');
        RAISE NOTICE 'Removed existing minute-based cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing minute-based cron job found, continuing...';
    END;
END
$$;

-- Schedule the send-reminder-emails function to run every minute
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
          'send-message-reminders-every-minute',
          '* * * * *', -- Run every minute
          http_request
        );
        
        RAISE NOTICE 'Successfully scheduled new cron job to run every minute';
    ELSE
        RAISE NOTICE 'pg_cron extension tables not found, skipping cron job creation';
    END IF;
END
$$;

-- Run the reminder check immediately once to catch any pending reminders
-- FIXED: Now using forceSend: true to ensure reminders are sent even without trigger dates
DO $$
BEGIN
  PERFORM
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true, "forceSend": true}'::jsonb
    );
    
  RAISE NOTICE 'Immediate reminder check triggered';
END $$;
