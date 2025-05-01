
import { getAuthClient } from "@/lib/supabaseClient";
import { FileAttachment } from "@/components/FileUploader";

// Create a storage client for files
export async function uploadAttachments(userId: string, files: FileAttachment[]) {
  try {
    const client = await getAuthClient();
    
    // Process each file
    const uploadPromises = files.map(async (file) => {
      // Create a unique file path
      const filePath = `${userId}/${Date.now()}-${file.name}`;
      
      // Upload to storage - use message_attachments bucket (fix for "bucket not found" error)
      const { error } = await client.storage
        .from('message_attachments')
        .upload(filePath, file.file);
      
      if (error) throw error;
      
      // Return the file info to be stored in the message
      return {
        path: filePath,
        name: file.name,
        size: file.size,
        type: file.type
      };
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading attachments:', error);
    throw error;
  }
}

export async function deleteAttachment(path: string) {
  try {
    const client = await getAuthClient();
    
    const { error } = await client.storage
      .from('message_attachments')
      .remove([path]);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
}

export async function getAttachmentUrl(path: string) {
  try {
    const client = await getAuthClient();
    
    const { data, error } = await client.storage
      .from('message_attachments')
      .createSignedUrl(path, 3600); // URL expires in 1 hour
    
    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
}
