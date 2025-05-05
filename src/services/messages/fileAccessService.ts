
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Access a file using our secure edge function for public access
 * 
 * @param filePath The file path in storage
 * @param deliveryId The delivery ID for authentication
 * @param recipientEmail The recipient email for authentication
 * @returns The URL to access the file
 */
export async function getPublicFileUrl(
  filePath: string,
  deliveryId: string,
  recipientEmail: string
) {
  if (!filePath || !deliveryId || !recipientEmail) {
    console.error("Missing required parameters for file access", { 
      filePath: filePath || "missing", 
      deliveryId: deliveryId || "missing", 
      recipientEmail: recipientEmail || "missing" 
    });
    toast({
      title: "File Access Error",
      description: "Missing required information for file access",
      variant: "destructive"
    });
    return null;
  }

  try {
    // Hard-coded Supabase project URL to ensure consistency
    const baseUrl = "https://onwthrpgcnfydxzzmyot.supabase.co";
    
    // Clean and encode path components - ensure we're very careful with encoding
    const encodedPath = encodeURIComponent(filePath);
    const encodedDeliveryId = encodeURIComponent(deliveryId);
    const encodedEmail = encodeURIComponent(recipientEmail);
    
    console.log("File access parameters:", {
      baseUrl,
      filePath,
      encodedPath,
      deliveryId,
      encodedDeliveryId,
      recipientEmail,
      encodedEmail
    });
    
    // Set a longer expiration for the URL (3 hours = 10800 seconds)
    const expiresIn = 10800;
    
    // Construct the URL to our edge function with the correct path structure
    const accessUrl = `${baseUrl}/functions/v1/access-file/file/${encodedPath}?delivery=${encodedDeliveryId}&recipient=${encodedEmail}&expires=${Date.now() + (expiresIn * 1000)}`;
    
    console.log(`Generated public file access URL: ${accessUrl}`);
    
    return accessUrl;
  } catch (error) {
    console.error("Error generating public file URL:", error);
    
    // If edge function approach fails, try direct signed URL as fallback
    try {
      console.log("Attempting fallback to signed URL approach");
      const signedUrl = await getAuthenticatedFileUrl(filePath, true);
      
      if (signedUrl) {
        console.log("Successfully generated fallback signed URL");
        return signedUrl;
      }
    } catch (fallbackError) {
      console.error("Fallback mechanism also failed:", fallbackError);
    }
    
    toast({
      title: "File Access Error",
      description: "Failed to generate secure access link for the file",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Get a signed URL for authenticated access to a file
 * 
 * @param filePath The file path in storage
 * @param skipAuth Whether to skip authentication check (for fallback)
 * @returns The signed URL for the file
 */
export async function getAuthenticatedFileUrl(filePath: string, skipAuth = false) {
  if (!filePath) {
    console.error("No file path provided");
    return null;
  }

  try {
    // Standardize on the message-attachments bucket
    const bucketName = "message-attachments";
    
    // Clean up the file path if it contains bucket name
    let cleanFilePath = filePath;
    if (filePath.startsWith('message-attachments/') || filePath.startsWith('message_attachments/')) {
      cleanFilePath = filePath.includes('/') ? filePath.substring(filePath.indexOf('/') + 1) : filePath;
    }
    
    console.log(`Generating signed URL for file: ${cleanFilePath} from bucket: ${bucketName}`);
    
    // Extended to 24 hours (86400 seconds)
    const expiresIn = 86400; 
    
    // Try with the standard bucket name
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(cleanFilePath, expiresIn); 
    
    if (error) {
      console.error("Error generating signed URL:", error);
      
      // Only try alternative bucket if there's an error with the standard bucket
      if (error.message.includes("does not exist") || error.message.includes("not found")) {
        console.log("File not found in primary bucket, trying alternative bucket name");
        
        // Try the alternative bucket naming format as fallback
        const alternativeBucket = "message_attachments";
        
        const alternativeResult = await supabase.storage
          .from(alternativeBucket)
          .createSignedUrl(cleanFilePath, expiresIn);
          
        if (alternativeResult.error) {
          console.error("Error with alternative bucket:", alternativeResult.error);
          throw new Error(`File access error: ${alternativeResult.error.message}`);
        }
        
        console.log("Successfully generated URL with alternative bucket");
        return alternativeResult.data.signedUrl;
      }
      
      throw new Error(`File access error: ${error.message}`);
    }
    
    if (!data?.signedUrl) {
      console.error("No signed URL returned from Supabase");
      throw new Error("No URL generated for the file");
    }
    
    console.log(`Successfully generated signed URL for ${cleanFilePath}`);
    return data.signedUrl;
  } catch (error) {
    console.error("Error getting file URL:", error);
    if (!skipAuth) {
      toast({
        title: "File Access Error",
        description: "Could not access the file. It may have been deleted or you don't have permission to view it.",
        variant: "destructive"
      });
    }
    return null;
  }
}
