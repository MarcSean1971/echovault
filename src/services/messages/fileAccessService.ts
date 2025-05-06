
import { supabase } from "@/integrations/supabase/client";

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
    // Edge function URL for accessing files - use string concatenation to avoid accessing protected property
    const functionUrl = `${window.location.origin}/functions/access-file/file/${encodeURIComponent(filePath)}`;
    
    // Add query parameters
    const url = new URL(functionUrl);
    url.searchParams.append('delivery', deliveryId);
    url.searchParams.append('recipient', recipientEmail);
    url.searchParams.append('mode', mode);
    
    // Add explicit download parameter for download mode
    if (mode === 'download') {
      url.searchParams.append('download', 'true');
      url.searchParams.append('forceDownload', 'true');
    }
    
    // Add cache-busting parameter
    url.searchParams.append('t', Date.now().toString());
    url.searchParams.append('expires', (Date.now() + 3600000).toString()); // 1 hour expiry
    
    console.log(`Generated file access URL: ${url.toString()}`);
    return url.toString();
  } catch (error) {
    console.error("Error generating public file URL:", error);
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
    const pathParts = filePath.split('/');
    const bucketName = pathParts[0];
    const filePathInBucket = pathParts.slice(1).join('/');
    
    // Get signed URL from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePathInBucket, 60, {
        download: forDownload,
        transform: undefined
      });
    
    if (error) {
      console.error("Error getting signed URL:", error);
      
      if (includeFallback) {
        // Try direct public URL as fallback
        return getDirectPublicUrl(filePath);
      }
      
      return null;
    }
    
    if (!data?.signedUrl) {
      console.error("No signed URL returned");
      return null;
    }
    
    // If download is requested, ensure URL has download parameter
    if (forDownload) {
      const url = new URL(data.signedUrl);
      if (!url.searchParams.has('download')) {
        url.searchParams.append('download', 'true');
        url.searchParams.append('forceDownload', 'true');
        return url.toString();
      }
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error("Error generating authenticated file URL:", error);
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
    const pathParts = filePath.split('/');
    const bucketName = pathParts[0];
    const filePathInBucket = pathParts.slice(1).join('/');
    
    // Get public URL from Supabase storage
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePathInBucket);
    
    if (!data?.publicUrl) {
      console.error("No public URL returned");
      return null;
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error("Error generating direct public URL:", error);
    return null;
  }
};
