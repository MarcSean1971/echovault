
-- Fix stuck reminders (those in 'processing' state for too long)
UPDATE public.reminder_schedule
SET status = 'pending', 
    retry_count = 0, 
    updated_at = NOW()
WHERE status = 'processing' 
  AND last_attempt_at < NOW() - INTERVAL '5 minutes';

-- Update all existing non-final reminders to be checked
UPDATE public.reminder_schedule
SET status = 'pending',
    updated_at = NOW()
WHERE status = 'processing'
  AND reminder_type = 'reminder';

-- Log the fix
INSERT INTO public.reminder_delivery_log
  (reminder_id, message_id, condition_id, recipient, delivery_channel, delivery_status, response_data)
VALUES 
  ('fixstuck-migration', null, null, 'system', 'admin', 'processing', 
   jsonb_build_object('note', 'Automatic fix for stuck reminders', 'timestamp', NOW()));

-- Optimize cron job to run more frequently for better reliability
-- First remove any existing jobs
DO $$
BEGIN
    -- Try to unschedule existing cron jobs
    BEGIN
        PERFORM cron.unschedule('send-message-reminders-15min');
    EXCEPTION WHEN OTHERS THEN
        -- Job might not exist, that's fine
    END;
    
    BEGIN
        PERFORM cron.unschedule('send-message-reminders-every-minute');
    EXCEPTION WHEN OTHERS THEN
        -- Job might not exist, that's fine
    END;
    
    BEGIN
        PERFORM cron.unschedule('fix-stuck-reminders');
    EXCEPTION WHEN OTHERS THEN
        -- Job might not exist, that's fine
    END;
END
$$;

-- Create a more frequent reminder check job (every 5 minutes instead of 15)
DO $$
DECLARE
  http_request text;
BEGIN
    http_request := 
      'SELECT
        net.http_post(
          url:=''https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails'',
          headers:=''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}''::jsonb,
          body:=''{"debug": true, "source": "cron_job_5min"}''::jsonb
        ) as request_id;';
        
    PERFORM cron.schedule(
      'send-message-reminders-5min',
      '*/5 * * * *', -- Run every 5 minutes
      http_request
    );
END
$$;

-- Create a job to fix stuck reminders every hour
DO $$
DECLARE
  http_request text;
BEGIN
    http_request := 
      'SELECT
        net.http_post(
          url:=''https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails'',
          headers:=''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}''::jsonb,
          body:=''{"action": "fix-stuck", "debug": true, "source": "cron_job_hourly"}''::jsonb
        ) as request_id;';
        
    PERFORM cron.schedule(
      'fix-stuck-reminders',
      '0 * * * *', -- Run every hour at minute 0
      http_request
    );
END
$$;

-- Run the reminder check immediately to catch any pending reminders
DO $$
BEGIN
  PERFORM
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true, "forceSend": true, "source": "immediate_migration_check"}'::jsonb
    );
END $$;
