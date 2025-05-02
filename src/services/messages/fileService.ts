
import { getAuthClient } from "@/lib/supabaseClient";
import { FileAttachment } from "@/components/FileUploader";

/**
 * Uploads files to Supabase storage
 * 
 * @param userId The user ID to organize the storage path
 * @param files The files to upload
 * @returns Array of attachment objects with paths
 */
export async function uploadAttachments(userId: string, files: FileAttachment[]) {
  const client = await getAuthClient();
  const bucket = "message-attachments";

  // Create an array to store attachment data
  const attachmentData = [];
  
  // Process each file
  for (const attachment of files) {
    if (!attachment.file) {
      // If this is already an uploaded file, just include its data
      if (attachment.isUploaded && attachment.path) {
        attachmentData.push({
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          path: attachment.path
        });
      }
      continue;
    }
    
    // Create a file path using the user ID, current timestamp, and original filename
    const timestamp = new Date().getTime();
    const filePath = `${userId}/${timestamp}_${attachment.name}`;
    
    // Upload the file
    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, attachment.file, {
        upsert: true,
        contentType: attachment.type
      });
      
    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }
    
    // Add the file data to our attachments array
    attachmentData.push({
      name: attachment.name,
      size: attachment.size,
      type: attachment.type,
      path: data.path
    });
  }
  
  return attachmentData;
}

/**
 * Gets a public URL for a file in storage
 * 
 * @param path The file path in storage
 * @returns The public URL for the file
 */
export async function getFileUrl(path: string) {
  const client = await getAuthClient();
  const bucket = "message-attachments";
  
  const { data } = client.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return data.publicUrl;
}
