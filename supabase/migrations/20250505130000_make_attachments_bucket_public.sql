
-- First create message-attachments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'message-attachments', 'message-attachments', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'message-attachments');

-- Update the existing bucket to be public if it exists but isn't public
UPDATE storage.buckets
SET public = true
WHERE id = 'message-attachments' AND public = false;

-- Create public access policy for attachments
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 
    'Public Access to Authenticated File Links',
    'message-attachments',
    'SELECT',
    'TRUE'
WHERE 
    NOT EXISTS (
        SELECT 1 
        FROM storage.policies 
        WHERE bucket_id = 'message-attachments' 
        AND operation = 'SELECT' 
        AND name = 'Public Access to Authenticated File Links'
    );
