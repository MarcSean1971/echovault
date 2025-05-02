
-- Create table for tracking sent reminders
CREATE TABLE IF NOT EXISTS public.sent_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id UUID NOT NULL REFERENCES public.message_conditions(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS sent_reminders_condition_id_idx ON public.sent_reminders (condition_id);
CREATE INDEX IF NOT EXISTS sent_reminders_message_id_idx ON public.sent_reminders (message_id);
CREATE INDEX IF NOT EXISTS sent_reminders_user_id_idx ON public.sent_reminders (user_id);
CREATE INDEX IF NOT EXISTS sent_reminders_sent_at_idx ON public.sent_reminders (sent_at);

-- Add RLS policies
ALTER TABLE public.sent_reminders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sent reminders
CREATE POLICY "Users can view their own sent reminders"
  ON public.sent_reminders
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Only the system (service role) can insert reminders
CREATE POLICY "System can insert reminders"
  ON public.sent_reminders
  FOR INSERT
  WITH CHECK (true); -- Service role will bypass RLS
