
-- First, drop the problematic policy that's causing the infinite recursion
DROP POLICY IF EXISTS "Allow public access to messages with valid delivery_id" ON public.messages;

-- Create a security definer function to break the recursion cycle
CREATE OR REPLACE FUNCTION public.message_has_delivery(msg_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.delivered_messages 
    WHERE message_id = msg_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create a proper policy using the security definer function
CREATE POLICY "Allow public access to messages with valid delivery_id" 
ON public.messages
FOR SELECT 
USING (public.message_has_delivery(id) OR auth.uid() = user_id::uuid);
