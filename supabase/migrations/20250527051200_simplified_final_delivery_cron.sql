
-- Simplified cron job for final message delivery
-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron jobs to start fresh
DO $$
BEGIN
    -- Remove existing notification cron jobs
    BEGIN
        PERFORM cron.unschedule('check-message-notifications');
        RAISE NOTICE 'Successfully removed existing notification cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing notification cron job found';
    END;
    
    BEGIN
        PERFORM cron.unschedule('check-critical-message-notifications');
        RAISE NOTICE 'Successfully removed existing critical notification cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing critical notification cron job found';
    END;
END
$$;

-- Create a simple cron job that checks for final message delivery every minute
SELECT cron.schedule(
  'final-message-delivery-check',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-message-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true, "source": "final_delivery_cron"}'::jsonb
    ) as request_id;
  $$
);

-- Create a separate cron job for check-in reminders every 5 minutes
SELECT cron.schedule(
  'checkin-reminder-check',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true, "source": "checkin_reminder_cron"}'::jsonb
    ) as request_id;
  $$
);

-- Run an immediate check for final deliveries
DO $$
BEGIN
  PERFORM
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-message-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": true, "source": "immediate_final_delivery_check"}'::jsonb
    );
    
  RAISE NOTICE 'Immediate final delivery check triggered';
END $$;
