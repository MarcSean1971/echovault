
import { supabase } from "@/integrations/supabase/client";

// Define valid bucket names for consistency
const DEFAULT_ATTACHMENT_BUCKET = "message-attachments";
const LEGACY_ATTACHMENT_BUCKET = "message_attachments";

/**
 * Get a public URL for a file using the edge function
 */
export const getPublicFileUrl = async (
  filePath: string, 
  deliveryId: string, 
  recipientEmail: string,
  mode: 'view' | 'download' = 'view'
): Promise<string | null> => {
  try {
    // Use Supabase project URL for proper Edge Function URL generation
    const supabaseUrl = "https://onwthrpgcnfydxzzmyot.supabase.co";
    
    // Build the URL with properly encoded parameters
    const functionUrl = `${supabaseUrl}/functions/v1/access-file/file/${encodeURIComponent(filePath)}`;
    const url = new URL(functionUrl);
    
    // Add required parameters
    url.searchParams.append('delivery', deliveryId);
    url.searchParams.append('recipient', recipientEmail);
    
    // Set download mode if requested
    if (mode === 'download') {
      url.searchParams.append('download-file', 'true');
      url.searchParams.append('mode', 'download');
    }
    
    // Add timestamp to prevent caching
    url.searchParams.append('t', Date.now().toString());
    
    console.log(`[FileAccess] Generated file access URL: ${url.toString()}`);
    return url.toString();
  } catch (error) {
    console.error("[FileAccess] Error generating public file URL:", error);
    return null;
  }
};

/**
 * Get an authenticated URL for a file using Supabase storage
 */
export const getAuthenticatedFileUrl = async (
  filePath: string, 
  includeFallback: boolean = false,
  forDownload: boolean = false
): Promise<string | null> => {
  try {
    // Extract bucket name and file path
    let bucketName = DEFAULT_ATTACHMENT_BUCKET;
    let filePathInBucket = filePath;
    
    // Check if the path includes a bucket prefix
    if (filePath.includes('/')) {
      const pathParts = filePath.split('/');
      if (pathParts[0] === DEFAULT_ATTACHMENT_BUCKET || pathParts[0] === LEGACY_ATTACHMENT_BUCKET) {
        bucketName = pathParts[0];
        filePathInBucket = pathParts.slice(1).join('/');
      }
    }
    
    // Get signed URL from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePathInBucket, 60, { download: forDownload });
    
    if (error) {
      // Try with alternative bucket if needed
      if (includeFallback) {
        const altBucketName = bucketName === DEFAULT_ATTACHMENT_BUCKET ? 
                            LEGACY_ATTACHMENT_BUCKET : DEFAULT_ATTACHMENT_BUCKET;
        
        const { data: altData } = await supabase.storage
          .from(altBucketName)
          .createSignedUrl(filePathInBucket, 60, { download: forDownload });
          
        if (altData?.signedUrl) {
          return altData.signedUrl;
        }
        
        // Try direct URL as final fallback
        return getDirectPublicUrl(filePath);
      }
      
      return null;
    }
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error("[FileAccess] Error generating authenticated file URL:", error);
    return null;
  }
};

/**
 * Get a direct public URL for a file
 */
export const getDirectPublicUrl = (filePath: string): string | null => {
  try {
    // Extract bucket name and file path
    let bucketName = DEFAULT_ATTACHMENT_BUCKET;
    let filePathInBucket = filePath;
    
    // Check if the path includes a bucket prefix
    if (filePath.includes('/')) {
      const pathParts = filePath.split('/');
      if (pathParts[0] === DEFAULT_ATTACHMENT_BUCKET || pathParts[0] === LEGACY_ATTACHMENT_BUCKET) {
        bucketName = pathParts[0];
        filePathInBucket = pathParts.slice(1).join('/');
      }
    }
    
    // Get public URL from primary bucket
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePathInBucket);
    
    if (!data?.publicUrl) {
      // Try with alternative bucket
      const altBucketName = bucketName === DEFAULT_ATTACHMENT_BUCKET ? 
                          LEGACY_ATTACHMENT_BUCKET : DEFAULT_ATTACHMENT_BUCKET;
      
      const { data: altData } = supabase.storage.from(altBucketName).getPublicUrl(filePathInBucket);
      return altData?.publicUrl || null;
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error("[FileAccess] Error generating direct public URL:", error);
    return null;
  }
};
