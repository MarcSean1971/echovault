
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
    // Get the current session to extract the token for authorization (if available)
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    
    console.log(`[FileAccess] Getting public file URL, auth token ${token ? 'present' : 'missing'}`);
    console.log(`[FileAccess] Delivery context - ID: ${deliveryId}, Recipient: ${recipientEmail?.substring(0, 3)}...`);
    console.log(`[FileAccess] File path: ${filePath}`);

    // Normalize file path - remove 'file/' prefix if it exists
    const normalizedPath = filePath.startsWith('file/') ? filePath.substring(5) : filePath;
    console.log(`[FileAccess] Normalized file path: ${normalizedPath}`);

    // Use Supabase SDK's built-in function invocation which handles authentication
    // This is the preferred method when a token is available
    if (token) {
      console.log("[FileAccess] Using supabase.functions.invoke with auth");
      try {
        const { data, error } = await supabase.functions.invoke('access-file', {
          body: {
            filePath: normalizedPath, // Send normalized path
            delivery: deliveryId,
            recipient: recipientEmail,
            mode: mode,
            download: mode === 'download'
          }
        });

        if (!error && data?.url) {
          console.log("[FileAccess] Successfully generated URL via function invoke");
          return data.url;
        } else if (error) {
          console.warn("[FileAccess] Error invoking access-file function:", error);
          console.log("[FileAccess] Error response:", JSON.stringify(error));
          // Continue to fallback method
        }
      } catch (invokeError) {
        console.warn("[FileAccess] Exception invoking function:", invokeError);
        // Continue to fallback method
      }
    }

    // Fallback to the direct URL method
    // Use Supabase project URL for proper Edge Function URL generation
    const supabaseUrl = "https://onwthrpgcnfydxzzmyot.supabase.co";
    
    // Build the URL with properly encoded parameters
    // IMPORTANT: Don't add "file/" prefix - send the normalized path directly
    const functionUrl = `${supabaseUrl}/functions/v1/access-file/${encodeURIComponent(normalizedPath)}`;
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

    // Add the API key for anonymous access
    // This key is public anyway since it's used in the frontend
    // We get it from the client to ensure it's always available
    const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs";
    url.searchParams.append('apikey', anonKey);
    
    // Include the auth token if available
    if (token) {
      url.searchParams.append('auth_token', token);
    }
    
    // Log the generated URL for debugging (mask full URL to prevent sensitive data exposure)
    const maskedUrl = url.toString().replace(recipientEmail, recipientEmail?.substring(0, 3) + '...');
    console.log(`[FileAccess] Generated file access URL (masked): ${maskedUrl}`);
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
    
    console.log(`[FileAccess] Getting authenticated URL for ${bucketName}/${filePathInBucket}`);
    
    // Get signed URL from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePathInBucket, 60, { download: forDownload });
    
    if (error) {
      console.warn(`[FileAccess] Error getting signed URL: ${error.message}`);
      
      // Try with alternative bucket if needed or requested
      if (includeFallback) {
        const altBucketName = bucketName === DEFAULT_ATTACHMENT_BUCKET ? 
                            LEGACY_ATTACHMENT_BUCKET : DEFAULT_ATTACHMENT_BUCKET;
        
        console.log(`[FileAccess] Trying alternate bucket: ${altBucketName}`);
        const { data: altData } = await supabase.storage
          .from(altBucketName)
          .createSignedUrl(filePathInBucket, 60, { download: forDownload });
          
        if (altData?.signedUrl) {
          console.log(`[FileAccess] Successfully generated signed URL from alternate bucket`);
          return altData.signedUrl;
        }
        
        // Try with just the filename as a fallback
        const fileName = filePathInBucket.split('/').pop();
        if (fileName && fileName !== filePathInBucket) {
          console.log(`[FileAccess] Trying with just filename: ${fileName}`);
          const { data: fileNameData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(fileName, 60, { download: forDownload });
            
          if (fileNameData?.signedUrl) {
            console.log(`[FileAccess] Successfully generated signed URL using just filename`);
            return fileNameData.signedUrl;
          }
        }
        
        // Try direct URL as final fallback
        console.log(`[FileAccess] Trying direct URL as final authenticated fallback`);
        return getDirectPublicUrl(filePath);
      }
      
      return null;
    }
    
    console.log(`[FileAccess] Generated signed URL successfully`);
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
    
    console.log(`[FileAccess] Getting direct URL for ${bucketName}/${filePathInBucket}`);
    
    // Get public URL from primary bucket
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePathInBucket);
    
    if (!data?.publicUrl) {
      console.log(`[FileAccess] No public URL found, trying alternate bucket`);
      // Try with alternative bucket
      const altBucketName = bucketName === DEFAULT_ATTACHMENT_BUCKET ? 
                          LEGACY_ATTACHMENT_BUCKET : DEFAULT_ATTACHMENT_BUCKET;
      
      const { data: altData } = supabase.storage.from(altBucketName).getPublicUrl(filePathInBucket);
      
      if (!altData?.publicUrl) {
        // Try with just the filename as a last resort
        const fileName = filePathInBucket.split('/').pop();
        if (fileName && fileName !== filePathInBucket) {
          console.log(`[FileAccess] Trying with just filename: ${fileName}`);
          const { data: fileNameData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
          return fileNameData?.publicUrl || null;
        }
      }
      
      return altData?.publicUrl || null;
    }
    
    console.log(`[FileAccess] Generated direct URL successfully`);
    return data.publicUrl;
  } catch (error) {
    console.error("[FileAccess] Error generating direct public URL:", error);
    return null;
  }
};
