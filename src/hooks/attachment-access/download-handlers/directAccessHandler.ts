
import { FileAccessManager } from "@/services/messages/fileAccess";
import { DownloadHandlerProps } from "./types";
import { toast } from "@/components/ui/use-toast";

/**
 * Handles direct URL access to files
 */
export function useDirectAccessHandler({ props, utilities }: DownloadHandlerProps) {
  const {
    filePath
  } = props;
  
  const {
    setIsLoading,
    setAccessUrl,
    setDownloadMethod,
    updateMethodStatus
  } = utilities;
  
  // Create file access manager
  const fileAccessManager = new FileAccessManager(filePath, props.deliveryId, props.recipientEmail);
  
  // Get direct public URL (for direct access option)
  const directUrl = fileAccessManager.getDirectUrl();

  const tryDirectAccess = async () => {
    setIsLoading(true);
    
    try {
      console.log(`[DirectAccess] Attempting direct access for file: ${filePath}`);
      console.log(`[DirectAccess] Delivery context - ID: ${props.deliveryId || 'none'}, Recipient: ${props.recipientEmail ? props.recipientEmail.substring(0, 3) + '...' : 'none'}`);
      
      // Try secure method first
      try {
        console.log('[DirectAccess] Trying secure edge function method first');
        const { url, method } = await fileAccessManager.getAccessUrl('secure');
        
        if (url && method === 'secure') {
          console.log('[DirectAccess] Secure access successful');
          updateMethodStatus(method, true);
          setIsLoading(false);
          return { success: true, url, method };
        }
      } catch (secureError) {
        console.warn('[DirectAccess] Secure access failed:', secureError);
        updateMethodStatus('secure', false);
      }
      
      // Try signed URL next
      try {
        console.log('[DirectAccess] Trying signed URL method');
        const { url, method } = await fileAccessManager.getAccessUrl('signed');
        
        if (url && method === 'signed') {
          console.log('[DirectAccess] Signed URL access successful');
          updateMethodStatus(method, true);
          setIsLoading(false);
          return { success: true, url, method };
        }
      } catch (signedError) {
        console.warn('[DirectAccess] Signed URL access failed:', signedError);
        updateMethodStatus('signed', false);
      }
      
      // Fall back to direct URL
      console.log('[DirectAccess] Falling back to direct URL');
      if (directUrl) {
        updateMethodStatus('direct', true);
        setAccessUrl(directUrl);
        setDownloadMethod('direct');
        setIsLoading(false);
        return { success: true, url: directUrl, method: 'direct' };
      }
      
      throw new Error("All access methods failed");
    } catch (error) {
      console.error("[DirectAccess] Error in direct access:", error);
      setIsLoading(false);
      
      // Try to provide a fallback with just the direct URL
      if (directUrl) {
        console.log("[DirectAccess] Using direct URL as final fallback");
        toast({
          title: "Limited access available",
          description: "Using direct file access as fallback. Some features may be limited.",
          variant: "warning"
        });
        return { success: true, url: directUrl, method: 'direct' };
      }
      
      return { success: false, url: null, method: null };
    }
  };

  return {
    directUrl,
    tryDirectAccess
  };
}
