
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

  const tryDirectAccess = async (): Promise<{ success: boolean; url: string | null; method: AccessMethod | null }> => {
    setIsLoading(true);
    
    try {
      console.log(`[DirectAccess] Attempting direct access for file: ${filePath}`);
      console.log(`[DirectAccess] Delivery context - ID: ${props.deliveryId || 'none'}, Recipient: ${props.recipientEmail ? props.recipientEmail.substring(0, 3) + '...' : 'none'}`);
      
      // Try signed URL first as it's more reliable
      try {
        console.log('[DirectAccess] Trying signed URL method first (now preferred)');
        const result = await fileAccessManager.getAccessUrl('signed');
        
        if (result.url && result.method === 'signed') {
          console.log('[DirectAccess] Signed URL access successful');
          updateMethodStatus(result.method, true);
          setAccessUrl(result.url);
          setDownloadMethod(result.method);
          setIsLoading(false);
          return { success: true, url: result.url, method: result.method };
        }
      } catch (signedError) {
        console.warn('[DirectAccess] Signed URL access failed:', signedError);
      }
      
      // Then try secure edge function method
      try {
        console.log('[DirectAccess] Trying secure method via edge function');
        const result = await fileAccessManager.getAccessUrl('secure');
        
        if (result.url && result.method === 'secure') {
          console.log('[DirectAccess] Secure URL access successful');
          updateMethodStatus(result.method, true);
          setAccessUrl(result.url);
          setDownloadMethod(result.method);
          setIsLoading(false);
          return { success: true, url: result.url, method: result.method };
        }
      } catch (secureError) {
        console.warn('[DirectAccess] Secure URL access failed:', secureError);
      }
      
      // Finally try direct method as last resort
      if (directUrl) {
        console.log('[DirectAccess] Falling back to direct URL method');
        updateMethodStatus('direct', true);
        setAccessUrl(directUrl);
        setDownloadMethod('direct');
        setIsLoading(false);
        return { success: true, url: directUrl, method: 'direct' };
      }
      
      console.error('[DirectAccess] All access methods failed');
      updateMethodStatus('signed', false);
      updateMethodStatus('secure', false);
      updateMethodStatus('direct', false);
      setIsLoading(false);
      
      toast({
        title: "File access failed",
        description: "Could not access file with any available method. Please try again later.",
        variant: "destructive"
      });
      
      return { success: false, url: null, method: null };
    } catch (error) {
      console.error('[DirectAccess] Error in tryDirectAccess:', error);
      setIsLoading(false);
      return { success: false, url: null, method: null };
    }
  };

  return {
    directUrl,
    tryDirectAccess
  };
}
