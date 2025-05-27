
-- Fix cron job frequency and ensure proper reminder scheduling
-- The issue was that send-reminder-emails was ignoring the reminder_schedule table

-- Drop existing cron jobs to recreate them properly
DO $$
BEGIN
    -- Remove existing reminder cron jobs
    BEGIN
        PERFORM cron.unschedule('checkin-reminder-check');
        RAISE NOTICE 'Successfully removed existing checkin reminder cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No existing checkin reminder cron job found';
    END;
END
$$;

-- Create a more reasonable cron job that checks for due reminders every 2 minutes
-- This will only process reminders that are actually due according to the schedule
SELECT cron.schedule(
  'process-due-reminders',
  '*/2 * * * *', -- Every 2 minutes (more reasonable than every 5 minutes)
  $$
  SELECT
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/send-reminder-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"debug": false, "source": "scheduled_cron"}'::jsonb
    ) as request_id;
  $$
);

-- Keep the final message delivery cron job as is (every minute)
-- This one is working correctly and handles final deliveries to recipients
