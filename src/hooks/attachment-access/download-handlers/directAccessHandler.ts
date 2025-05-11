
import { FileAccessManager } from "@/services/messages/fileAccess";
import { DownloadHandlerProps } from "./types";
import { toast } from "@/components/ui/use-toast";
import { AccessMethod } from "@/components/message/detail/attachment/types";

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
      
      // Try signed URL first as it's more reliable
      try {
        console.log('[DirectAccess] Trying signed URL method first (now preferred)');
        const { url, method } = await fileAccessManager.getAccessUrl('signed');
        
        if (url && method === 'signed') {
          console.log('[DirectAccess] Signed URL access successful');
          updateMethodStatus(method, true);
          setAccessUrl(url);
          setDownloadMethod(method);
          setIsLoading(false);
          return { success: true, url, method };
        }
      } catch (signedError) {
        console.warn('[DirectAccess] Signed URL access failed:', signedError);
        updateMethodStatus('signed', false);
      }
      
      // Try secure method next
      try {
        console.log('[DirectAccess] Trying secure edge function method');
        const { url, method } = await fileAccessManager.getAccessUrl('secure');
        
        if (url && method === 'secure') {
          console.log('[DirectAccess] Secure access successful');
          updateMethodStatus(method, true);
          setAccessUrl(url);
          setDownloadMethod(method);
          setIsLoading(false);
          return { success: true, url, method };
        }
      } catch (secureError) {
        console.warn('[DirectAccess] Secure access failed:', secureError);
        updateMethodStatus('secure', false);
      }
      
      // Fallback to direct URL with API key
      console.log('[DirectAccess] Trying direct URL with API key');
      try {
        // Get the current session to extract the token for authorization (if available)
        const { data: sessionData } = await fileAccessManager.getAccessUrl('direct');
        
        if (sessionData.url) {
          console.log('[DirectAccess] Direct URL with API key successful');
          updateMethodStatus('direct', true);
          setAccessUrl(sessionData.url);
          setDownloadMethod('direct');
          setIsLoading(false);
          return { success: true, url: sessionData.url, method: 'direct' as AccessMethod };
        }
      } catch (directError) {
        console.warn('[DirectAccess] Direct URL with API key failed:', directError);
        updateMethodStatus('direct', false);
      }
      
      // Last resort - use plain direct URL
      if (directUrl) {
        console.log('[DirectAccess] Falling back to plain direct URL');
        updateMethodStatus('direct', true);
        setAccessUrl(directUrl);
        setDownloadMethod('direct');
        setIsLoading(false);
        return { success: true, url: directUrl, method: 'direct' as AccessMethod };
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
          variant: "destructive"
        });
        setAccessUrl(directUrl);
        setDownloadMethod('direct');
        return { success: true, url: directUrl, method: 'direct' as AccessMethod };
      }
      
      toast({
        title: "Access error",
        description: "Could not access the file. Please try again or contact support.",
        variant: "destructive"
      });
      
      return { success: false, url: null, method: null };
    }
  };

  return {
    directUrl,
    tryDirectAccess
  };
}
