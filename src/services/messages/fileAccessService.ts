
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
    // Get the origin dynamically with a fallback
    const baseUrl = window.location.origin;
    
    // Clean and encode path components
    const encodedPath = encodeURIComponent(filePath);
    const encodedDelivery = encodeURIComponent(deliveryId);
    const encodedRecipient = encodeURIComponent(recipientEmail);
    
    // Construct the URL to our edge function
    const accessUrl = `${baseUrl}/functions/v1/access-file/file/${encodedPath}?delivery=${encodedDelivery}&recipient=${encodedRecipient}`;
    
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
    // Determine the bucket name from the path or use default
    let bucketName = "message-attachments";
    
    // Try to extract bucket from path
    if (filePath.includes('/')) {
      const pathParts = filePath.split('/');
      if (pathParts[0] === "message-attachments" || pathParts[0] === "message_attachments") {
        bucketName = pathParts[0];
        // Adjust filePath if bucket is included
        filePath = pathParts.slice(1).join('/');
      }
    }
    
    console.log(`Generating signed URL for file: ${filePath} from bucket: ${bucketName}`);
    
    // Try with the given bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600);
    
    if (error) {
      console.error("Error generating signed URL:", error);
      
      // Try with the alternative bucket name as fallback
      const alternativeBucket = bucketName === "message-attachments" ? "message_attachments" : "message-attachments";
      
      console.log(`Trying alternative bucket: ${alternativeBucket}`);
      
      const alternativeResult = await supabase.storage
        .from(alternativeBucket)
        .createSignedUrl(filePath, 3600);
        
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
    
    console.log(`Successfully generated signed URL for ${filePath}`);
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
