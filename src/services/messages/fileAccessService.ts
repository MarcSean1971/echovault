
import { supabase } from "@/integrations/supabase/client";

// Define valid bucket names for consistency
const DEFAULT_ATTACHMENT_BUCKET = "message-attachments";
const LEGACY_ATTACHMENT_BUCKET = "message_attachments";

/**
 * Get a public URL for a file using the edge function
 * @param filePath File path in storage
 * @param deliveryId Delivery ID for authentication
 * @param recipientEmail Recipient email for authentication
 * @param mode Whether to view or download the file
 * @returns Promise with the URL
 */
export const getPublicFileUrl = async (
  filePath: string, 
  deliveryId: string, 
  recipientEmail: string,
  mode: 'view' | 'download' = 'view'
): Promise<string | null> => {
  try {
    // Get project URL for proper Edge Function URL generation
    const projectUrl = window.location.origin;
    console.log(`[FileAccess] Using project URL: ${projectUrl}`);
    
    // Edge function URL for accessing files - use explicit URL construction
    const functionUrl = `${projectUrl}/functions/access-file/file/${encodeURIComponent(filePath)}`;
    console.log(`[FileAccess] Base function URL: ${functionUrl}`);
    
    // Build URL with properly encoded parameters
    const url = new URL(functionUrl);
    
    // Add properly encoded parameters (ensure they're all strings)
    url.searchParams.append('delivery', deliveryId);
    url.searchParams.append('recipient', recipientEmail);
    url.searchParams.append('mode', mode);
    
    // Use download-file parameter instead of download to avoid ambiguity
    if (mode === 'download') {
      url.searchParams.append('download-file', 'true');
    }
    
    // Cache-busting parameter
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
 * @param filePath File path in storage
 * @param includeFallback Whether to include fallback options
 * @param forDownload Whether to set download flag
 * @returns Promise with the URL
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
      // Only treat the first part as a bucket if it's a known valid bucket name
      if (pathParts[0] === DEFAULT_ATTACHMENT_BUCKET || pathParts[0] === LEGACY_ATTACHMENT_BUCKET) {
        bucketName = pathParts[0];
        filePathInBucket = pathParts.slice(1).join('/');
      }
    }
    
    console.log(`[FileAccess] Getting signed URL for ${bucketName}/${filePathInBucket}`);
    
    // Get signed URL from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePathInBucket, 60, {
        download: forDownload,
        transform: undefined
      });
    
    if (error) {
      console.error(`[FileAccess] Error getting signed URL from ${bucketName}:`, error);
      
      // Try with the alternative bucket name if we got a bucket not found error
      if (error.message?.includes("not found") && bucketName === DEFAULT_ATTACHMENT_BUCKET) {
        console.log(`[FileAccess] Trying fallback bucket: ${LEGACY_ATTACHMENT_BUCKET}`);
        const fallbackResult = await supabase.storage
          .from(LEGACY_ATTACHMENT_BUCKET)
          .createSignedUrl(filePathInBucket, 60, {
            download: forDownload,
            transform: undefined
          });
          
        if (!fallbackResult.error && fallbackResult.data?.signedUrl) {
          console.log(`[FileAccess] Fallback bucket successful`);
          return fallbackResult.data.signedUrl;
        }
      }
      
      if (includeFallback) {
        // Try direct public URL as fallback
        return getDirectPublicUrl(filePath);
      }
      
      return null;
    }
    
    if (!data?.signedUrl) {
      console.error("[FileAccess] No signed URL returned");
      return null;
    }
    
    // ALWAYS ensure URL has download parameter for consistency
    const url = new URL(data.signedUrl);
    if (forDownload && !url.searchParams.has('download-file')) {
      url.searchParams.append('download-file', 'true');
      return url.toString();
    }
    
    console.log(`[FileAccess] Signed URL: ${data.signedUrl}`);
    return data.signedUrl;
  } catch (error) {
    console.error("[FileAccess] Error generating authenticated file URL:", error);
    return null;
  }
};

/**
 * Get a direct public URL for a file (less secure)
 * @param filePath File path in storage
 * @returns Direct public URL
 */
export const getDirectPublicUrl = (filePath: string): string | null => {
  try {
    // Extract bucket name and file path
    let bucketName = DEFAULT_ATTACHMENT_BUCKET;
    let filePathInBucket = filePath;
    
    // Check if the path includes a bucket prefix
    if (filePath.includes('/')) {
      const pathParts = filePath.split('/');
      // Only treat the first part as a bucket if it's a known valid bucket name
      if (pathParts[0] === DEFAULT_ATTACHMENT_BUCKET || pathParts[0] === LEGACY_ATTACHMENT_BUCKET) {
        bucketName = pathParts[0];
        filePathInBucket = pathParts.slice(1).join('/');
      }
    }
    
    console.log(`[FileAccess] Getting direct public URL for ${bucketName}/${filePathInBucket}`);
    
    // First try with the default bucket
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePathInBucket);
    
    if (!data?.publicUrl) {
      console.log(`[FileAccess] No public URL returned for ${bucketName}/${filePathInBucket}, trying fallback bucket`);
      
      // Try with the legacy bucket name
      const alternateBucket = bucketName === DEFAULT_ATTACHMENT_BUCKET ? 
        LEGACY_ATTACHMENT_BUCKET : DEFAULT_ATTACHMENT_BUCKET;
      const fallbackResult = supabase.storage.from(alternateBucket).getPublicUrl(filePathInBucket);
      
      if (fallbackResult.data?.publicUrl) {
        console.log(`[FileAccess] Fallback direct URL found: ${fallbackResult.data.publicUrl}`);
        return fallbackResult.data.publicUrl;
      }
      
      console.error(`[FileAccess] No direct public URL available for this file in either bucket`);
      return null;
    }
    
    console.log(`[FileAccess] Direct public URL: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    console.error("[FileAccess] Error generating direct public URL:", error);
    return null;
  }
};
