
-- Create a function to find duplicate reminders
CREATE OR REPLACE FUNCTION public.find_duplicate_reminders()
RETURNS TABLE (
  message_id UUID,
  condition_id UUID,
  reminder_type TEXT,
  count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    message_id, 
    condition_id, 
    reminder_type, 
    COUNT(*) as count
  FROM 
    public.reminder_schedule
  WHERE 
    status = 'pending'
  GROUP BY 
    message_id, condition_id, reminder_type
  HAVING 
    COUNT(*) > 1
  ORDER BY 
    count DESC;
$$;

-- Add index to improve performance of reminder queries
CREATE INDEX IF NOT EXISTS idx_reminder_schedule_message_condition_type 
ON public.reminder_schedule(message_id, condition_id, reminder_type, status);

-- Mark duplicate reminders as obsolete (keep the newest one for each message/condition/type)
UPDATE public.reminder_schedule
SET status = 'obsolete'
WHERE id IN (
  SELECT rs.id
  FROM public.reminder_schedule rs
  INNER JOIN (
    SELECT 
      message_id, 
      condition_id, 
      reminder_type,
      array_agg(id ORDER BY created_at DESC) as ids
    FROM 
      public.reminder_schedule
    WHERE 
      status = 'pending'
    GROUP BY 
      message_id, condition_id, reminder_type
    HAVING 
      COUNT(*) > 1
  ) dups ON rs.message_id = dups.message_id 
      AND rs.condition_id = dups.condition_id
      AND rs.reminder_type = dups.reminder_type
  WHERE rs.id != dups.ids[1] -- Keep the newest one (first in the array)
);

