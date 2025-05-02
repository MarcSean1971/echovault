
import { getAuthClient } from "@/lib/supabaseClient";
import { FileAttachment } from "@/components/FileUploader";

// Use a consistent bucket name
const BUCKET_NAME = 'message-attachments';

/**
 * Checks if a storage bucket exists
 * 
 * @param bucketName The name of the bucket to check
 * @returns Boolean indicating if the bucket exists
 */
export async function doesBucketExist(bucketName: string) {
  try {
    const client = await getAuthClient();
    const { data, error } = await client.storage.getBucket(bucketName);
    
    if (error) {
      console.error(`Error checking bucket ${bucketName}:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Error checking bucket ${bucketName}:`, error);
    return false;
  }
}

/**
 * Gets the appropriate bucket name to use
 * This is a temporary function to handle both bucket name formats
 * 
 * @returns The available bucket name
 */
export async function getAvailableBucketName() {
  // Check if the preferred bucket exists
  const preferredBucketExists = await doesBucketExist(BUCKET_NAME);
  if (preferredBucketExists) {
    return BUCKET_NAME;
  }
  
  // Check if alternative bucket name exists (with underscore)
  const alternativeBucketName = BUCKET_NAME.replace('-', '_');
  const alternativeBucketExists = await doesBucketExist(alternativeBucketName);
  if (alternativeBucketExists) {
    return alternativeBucketName;
  }
  
  // If neither exists, return preferred bucket name and it will be created on demand
  return BUCKET_NAME;
}

/**
 * Uploads files to Supabase storage
 * 
 * @param userId The user ID to organize the storage path
 * @param files The files to upload
 * @returns Array of attachment objects with paths
 */
export async function uploadAttachments(userId: string, files: FileAttachment[]) {
  const client = await getAuthClient();
  const bucket = await getAvailableBucketName();
  
  // Ensure the bucket exists before trying to upload
  try {
    const { data, error } = await client.storage.getBucket(bucket);
    if (error && error.message.includes('not found')) {
      // Create the bucket if it doesn't exist
      await client.storage.createBucket(bucket, {
        public: false
      });
    }
  } catch (error) {
    console.warn("Error checking or creating bucket:", error);
    // Continue anyway and let the upload handle any errors
  }

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
  const bucket = await getAvailableBucketName();
  
  const { data } = client.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return data.publicUrl;
}
