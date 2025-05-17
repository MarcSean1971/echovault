
-- NOTE: Run this SQL in your Supabase project SQL editor to create the acquire_due_reminders function

-- Function to acquire due reminders for processing with FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.acquire_due_reminders(
  max_reminders INTEGER DEFAULT 50,
  message_filter UUID DEFAULT NULL
)
RETURNS SETOF public.reminder_schedule
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH selected_reminders AS (
    SELECT *
    FROM public.reminder_schedule
    WHERE (status = 'pending')
      AND (scheduled_at <= NOW() OR retry_count > 0)
      AND (message_filter IS NULL OR message_id = message_filter)
    ORDER BY scheduled_at
    LIMIT max_reminders
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.reminder_schedule SET
    status = 'processing',
    last_attempt_at = NOW()
  FROM selected_reminders
  WHERE reminder_schedule.id = selected_reminders.id
  RETURNING reminder_schedule.*;
END;
$$;

-- Function to acquire reminders for a specific message (for force send)
CREATE OR REPLACE FUNCTION public.acquire_message_reminders(
  target_message_id UUID,
  max_reminders INTEGER DEFAULT 10
)
RETURNS SETOF public.reminder_schedule
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH selected_reminders AS (
    SELECT *
    FROM public.reminder_schedule
    WHERE message_id = target_message_id
      AND status = 'pending'
    ORDER BY scheduled_at
    LIMIT max_reminders
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.reminder_schedule SET
    status = 'processing',
    last_attempt_at = NOW()
  FROM selected_reminders
  WHERE reminder_schedule.id = selected_reminders.id
  RETURNING reminder_schedule.*;
END;
$$;
