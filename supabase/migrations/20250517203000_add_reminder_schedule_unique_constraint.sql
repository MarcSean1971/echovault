
-- Create unique constraint on reminder_schedule table
-- This is needed for the onConflict clause in upsert operations
ALTER TABLE IF EXISTS public.reminder_schedule 
ADD CONSTRAINT reminder_schedule_unique_constraint 
UNIQUE (message_id, condition_id, scheduled_at, reminder_type);

-- Add index on reminder_schedule for faster querying
CREATE INDEX IF NOT EXISTS reminder_schedule_message_id_status_idx 
ON public.reminder_schedule(message_id, status);
