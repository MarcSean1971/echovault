
-- Update reminder cron job frequency from every minute to every 5 minutes
-- and add duplicate prevention checks and time zone handling

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron jobs to avoid duplicates
DO $$
BEGIN
    -- Try to unschedule existing jobs, but don't error if they don't exist
    BEGIN
        PERFORM cron.unschedule('send-message-reminders-every-minute');
        RAISE NOTICE 'Successfully removed existing minute cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing cron job found with name send-message-reminders-every-minute, continuing...';
    END;
    
    BEGIN
        PERFORM cron.unschedule('send-message-reminders-15min');
        RAISE NOTICE 'Successfully removed existing 15-min cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing cron job found with name send-message-reminders-15min, continuing...';
    END;
END
$$;

-- Schedule the send-reminder-emails function to run every 5 minutes (instead of every minute or 15 minutes)
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
              body:=''{"debug": true, "preventDuplicates": true}''::jsonb
            ) as request_id;';
            
        PERFORM cron.schedule(
          'send-message-reminders-5min',     -- New name to distinguish from old jobs
          '*/5 * * * *',                    -- Run every 5 minutes (instead of every minute)
          http_request
        );
        
        RAISE NOTICE 'Successfully scheduled new cron job to run every 5 minutes';
    ELSE
        RAISE NOTICE 'pg_cron extension tables not found, skipping cron job creation';
    END IF;
END
$$;
