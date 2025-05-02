
-- Create the delivered_messages table to track message deliveries
CREATE TABLE IF NOT EXISTS public.delivered_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  condition_id UUID NOT NULL,
  recipient_id TEXT NOT NULL, 
  delivery_id UUID NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  viewed_count INTEGER DEFAULT 0,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS delivered_messages_message_id_idx ON public.delivered_messages(message_id);
CREATE INDEX IF NOT EXISTS delivered_messages_delivery_id_idx ON public.delivered_messages(delivery_id);
CREATE INDEX IF NOT EXISTS delivered_messages_recipient_id_idx ON public.delivered_messages(recipient_id);

-- Enable Row Level Security
ALTER TABLE public.delivered_messages ENABLE ROW LEVEL SECURITY;

-- Allow message creators to select their delivered messages
CREATE POLICY "Users can view their own message deliveries" ON public.delivered_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_id
      AND m.user_id = auth.uid()
    )
  );

-- Allow the system to insert delivery records
CREATE POLICY "System can insert delivery records" ON public.delivered_messages
  FOR INSERT
  WITH CHECK (true);

-- Allow recipients to update their view status
CREATE POLICY "Recipients can update view status" ON public.delivered_messages
  FOR UPDATE
  USING (true)
  WITH CHECK (viewed_at IS NULL OR viewed_count IS NOT NULL);
