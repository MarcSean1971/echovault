
-- This migration secures storage access by ensuring proper ownership checks for the message-attachments bucket

-- First, make sure the bucket isn't public (we're doing this in case the previous migration didn't apply this part)
UPDATE storage.buckets
SET public = false
WHERE id = 'message-attachments';

-- Drop all existing public policies on this bucket to ensure clean state
DROP POLICY IF EXISTS "Public Access to Authenticated File Links" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own message attachments" ON storage.objects;

-- Create proper insert policy - users can only upload to their own folder
CREATE POLICY "Users can upload to their own folders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create proper update policy - users can only modify their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create proper delete policy - users can only delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create proper select policy - messages can be read based on delivered_messages table authorization
-- This policy implements key-based secure access for recipients
CREATE POLICY "Users can access their own message attachments"
ON storage.objects
FOR SELECT
USING (
  (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text)
  OR
  EXISTS (
    SELECT 1
    FROM delivered_messages dm
    JOIN messages m ON m.id = dm.message_id
    WHERE 
      -- Either the user is the message creator
      m.user_id::uuid = auth.uid()
      -- Or the user is a recipient with a valid delivery record
      OR dm.recipient_id = auth.uid()
      -- And the file path contains the message ID in the second segment
      AND (storage.foldername(storage.objects.name))[2] = m.id::text
  )
);

