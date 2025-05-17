
-- Create index on reminder_schedule.message_id to optimize the performance
-- of message-based reminder lookups
CREATE INDEX IF NOT EXISTS reminder_schedule_message_id_idx 
ON public.reminder_schedule (message_id);

-- Create index on message_id and status combination for common query patterns
CREATE INDEX IF NOT EXISTS reminder_schedule_message_status_idx 
ON public.reminder_schedule (message_id, status);

-- Create index on scheduled_at for date-based queries
CREATE INDEX IF NOT EXISTS reminder_schedule_scheduled_at_idx 
ON public.reminder_schedule (scheduled_at);

-- Create composite index for the common query pattern of finding pending reminders by message
CREATE INDEX IF NOT EXISTS reminder_schedule_message_status_scheduled_idx 
ON public.reminder_schedule (message_id, status, scheduled_at);
