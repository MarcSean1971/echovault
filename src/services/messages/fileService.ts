
import { getAuthClient } from "@/lib/supabaseClient";
import { FileAttachment } from "@/components/FileUploader";
import { toast } from "@/components/ui/use-toast";

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
 * Gets a signed URL for a file in storage to ensure access
 * 
 * @param path The file path in storage
 * @returns The signed URL for the file or null if there's an error
 */
export async function getFileUrl(path: string) {
  if (!path) {
    console.error("No file path provided");
    return null;
  }

  try {
    const client = await getAuthClient();
    const bucket = await getAvailableBucketName();
    
    console.log(`Generating signed URL for file: ${path} from bucket: ${bucket}`);
    
    // Create a signed URL with a longer expiration time (1 hour)
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    
    if (error) {
      console.error("Error generating signed URL:", error);
      
      // Try with the alternative bucket name as fallback
      const alternativeBucket = bucket.includes('-') 
        ? bucket.replace('-', '_') 
        : bucket.replace('_', '-');
      
      console.log(`Trying alternative bucket: ${alternativeBucket}`);
      
      const alternativeResult = await client.storage
        .from(alternativeBucket)
        .createSignedUrl(path, 3600);
        
      if (alternativeResult.error) {
        console.error("Error with alternative bucket:", alternativeResult.error);
        return null;
      }
      
      console.log("Successfully generated URL with alternative bucket");
      return alternativeResult.data.signedUrl;
    }
    
    if (!data?.signedUrl) {
      console.error("No signed URL returned from Supabase");
      return null;
    }
    
    console.log(`Successfully generated signed URL for ${path}`);
    return data.signedUrl;
  } catch (error) {
    console.error("Error getting file URL:", error);
    toast({
      title: "File Access Error",
      description: "Could not access the file. It may have been deleted or you don't have permission to view it.",
      variant: "destructive"
    });
    return null;
  }
}
