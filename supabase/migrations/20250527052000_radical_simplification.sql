
-- RADICAL SIMPLIFICATION: Stop all spam and create one simple reminder system
-- Remove all existing cron jobs first
DO $$
BEGIN
    -- Remove ALL existing reminder-related cron jobs
    BEGIN
        PERFORM cron.unschedule('process-due-reminders');
        RAISE NOTICE 'Removed process-due-reminders cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'process-due-reminders cron job not found';
    END;
    
    BEGIN
        PERFORM cron.unschedule('final-message-delivery-check');
        RAISE NOTICE 'Removed final-message-delivery-check cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'final-message-delivery-check cron job not found';
    END;
    
    BEGIN
        PERFORM cron.unschedule('checkin-reminder-check');
        RAISE NOTICE 'Removed checkin-reminder-check cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'checkin-reminder-check cron job not found';
    END;
    
    BEGIN
        PERFORM cron.unschedule('check-message-notifications');
        RAISE NOTICE 'Removed check-message-notifications cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'check-message-notifications cron job not found';
    END;
    
    BEGIN
        PERFORM cron.unschedule('check-critical-message-notifications');
        RAISE NOTICE 'Removed check-critical-message-notifications cron job';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'check-critical-message-notifications cron job not found';
    END;
END
$$;

-- Create ONE simple cron job that processes reminders correctly
SELECT cron.schedule(
  'simple-reminder-processor',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url:='https://onwthrpgcnfydxzzmyot.supabase.co/functions/v1/process-simple-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs"}'::jsonb,
      body:='{"source": "simple_cron_processor"}'::jsonb
    ) as request_id;
  $$
);
