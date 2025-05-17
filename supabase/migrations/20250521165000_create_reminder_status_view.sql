
-- Create an efficient view to replace multiple queries for monitoring
-- This dramatically reduces database load for the monitoring function

-- First, drop the view if it exists to allow recreation
DROP VIEW IF EXISTS public.reminder_schedule_status;

-- Create the view that efficiently calculates all needed metrics in a single query
CREATE OR REPLACE VIEW public.reminder_schedule_status AS
WITH current_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_at <= NOW()) AS due_reminders,
    COUNT(*) FILTER (WHERE status = 'sent' AND last_attempt_at >= NOW() - INTERVAL '5 minutes') AS sent_last_5min,
    COUNT(*) FILTER (WHERE status = 'failed' AND last_attempt_at >= NOW() - INTERVAL '5 minutes') AS failed_last_5min
  FROM
    public.reminder_schedule
)
SELECT
  due_reminders,
  sent_last_5min,
  failed_last_5min
FROM
  current_stats;

-- Create an index to make the status view more efficient
CREATE INDEX IF NOT EXISTS idx_reminder_schedule_status_scheduled
ON public.reminder_schedule (status, scheduled_at);

-- Create an index to make the status view more efficient for recent changes
CREATE INDEX IF NOT EXISTS idx_reminder_schedule_status_attempt
ON public.reminder_schedule (status, last_attempt_at);

-- Analyze the table to update statistics for the query planner
ANALYZE public.reminder_schedule;
