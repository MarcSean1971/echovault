
-- Create table for tracking message notifications
-- This serves as a fallback mechanism when edge functions fail
CREATE TABLE IF NOT EXISTS public.message_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_type TEXT NOT NULL DEFAULT 'regular',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Add index on message_id for faster lookups
CREATE INDEX IF NOT EXISTS message_notifications_message_id_idx ON public.message_notifications(message_id);

-- Add index on status for faster filtering of pending notifications
CREATE INDEX IF NOT EXISTS message_notifications_status_idx ON public.message_notifications(status);

-- Add database function to process pending notifications
-- This will be called by another process or trigger
CREATE OR REPLACE FUNCTION process_pending_notifications()
RETURNS INTEGER AS $$
DECLARE
  processed INTEGER := 0;
BEGIN
  -- Mark all pending notifications older than 5 minutes as failed
  -- This ensures we don't have stale pending notifications
  UPDATE public.message_notifications
  SET 
    status = 'failed',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{error}',
      '"Timed out waiting for processing"'::jsonb
    )
  WHERE 
    status = 'pending' 
    AND created_at < NOW() - INTERVAL '5 minutes';
  
  -- Count processed records
  GET DIAGNOSTICS processed = ROW_COUNT;
  
  RETURN processed;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that will automatically call process_pending_notifications
-- when a new notification is inserted
CREATE OR REPLACE FUNCTION process_notifications_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- First process any stale notifications
  PERFORM process_pending_notifications();
  
  -- Then return the NEW record to continue with the insert
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to the message_notifications table
DROP TRIGGER IF EXISTS process_notifications_trigger ON public.message_notifications;
CREATE TRIGGER process_notifications_trigger
BEFORE INSERT ON public.message_notifications
FOR EACH ROW
EXECUTE FUNCTION process_notifications_trigger();

-- Add RLS policies for the message_notifications table
ALTER TABLE public.message_notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own message notifications
CREATE POLICY message_notifications_select_policy
  ON public.message_notifications
  FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM public.messages WHERE user_id = auth.uid()
    )
  );

-- Allow users to insert their own message notifications
CREATE POLICY message_notifications_insert_policy
  ON public.message_notifications
  FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM public.messages WHERE user_id = auth.uid()
    )
  );
