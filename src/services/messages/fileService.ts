
import { supabase } from "@/integrations/supabase/client";
import { FileAttachment } from "@/components/FileUploader";

// Function to upload files to Supabase storage
export async function uploadAttachments(
  userId: string, 
  attachments: FileAttachment[]
): Promise<Array<{path: string, name: string, size: number, type: string}>> {
  const uploadPromises = attachments.map(async (attachment) => {
    const file = attachment.file;
    const filePath = `${userId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('message_attachments')
      .upload(filePath, file);
      
    if (error) throw error;
    
    return {
      path: data.path,
      name: file.name,
      size: file.size,
      type: file.type
    };
  });
  
  // Upload all files in parallel
  return Promise.all(uploadPromises);
}

// Function to get a signed URL for a file
export async function getFileUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from('message_attachments')
    .createSignedUrl(path, 3600); // 1 hour expiry
    
  return data?.signedUrl || '';
}

// Function to delete an attachment from storage
export async function deleteAttachment(path: string): Promise<void> {
  await supabase.storage
    .from('message_attachments')
    .remove([path]);
}
