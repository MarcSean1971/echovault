
import { toast } from "@/components/ui/use-toast";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { DownloadHandlerProps } from "./types";

/**
 * Handles retrying access to files
 */
export function useRetryAccessHandler({ props, utilities }: DownloadHandlerProps) {
  const {
    filePath
  } = props;
  
  const {
    updateMethodStatus,
    setIsLoading,
    setHasError,
    incrementRetryCount,
    setAccessUrl,
    setDownloadMethod
  } = utilities;
  
  // Create file access manager
  const fileAccessManager = new FileAccessManager(filePath, props.deliveryId, props.recipientEmail);
  
  // Get direct public URL (for direct access option)
  const directUrl = fileAccessManager.getDirectUrl();

  const retryAccess = async () => {
    setIsLoading(true);
    incrementRetryCount();
    
    try {
      // Define an array of methods to try
      const methodsToTry: AccessMethod[] = ['secure', 'signed', 'direct'];
      
      let succeeded = false;
      let lastError = null;
      
      for (const methodToTry of methodsToTry) {
        if (succeeded) break;
        
        try {
          console.log(`[RetryAccess] Attempting access using ${methodToTry} method`);
          console.log(`[RetryAccess] Delivery context - ID: ${props.deliveryId}, Recipient: ${props.recipientEmail?.substring(0, 3)}...`);
          
          const { url, method } = await fileAccessManager.getAccessUrl(methodToTry);
          
          if (url && method) {
            setHasError(false);
            setAccessUrl(url);
            setDownloadMethod(method);
            
            toast({
              title: "Retry successful",
              description: `Access restored using ${method === 'secure' ? 'Edge Function' : method === 'signed' ? 'Signed URL' : 'Direct URL'}`,
            });
            
            updateMethodStatus(method, true);
            succeeded = true;
            console.log(`[RetryAccess] Successfully accessed file using ${method} method, URL: ${url.substring(0, 30)}...`);
            break;
          } else {
            console.warn(`[RetryAccess] ${methodToTry} method returned empty URL or method`);
          }
        } catch (methodError) {
          lastError = methodError;
          console.error(`[RetryAccess] Error trying ${methodToTry} method:`, methodError);
          updateMethodStatus(methodToTry, false);
        }
      }
      
      if (!succeeded) {
        setHasError(true);
        
        // Try to get direct URL as final fallback
        const fallbackUrl = fileAccessManager.getDirectUrl();
        if (fallbackUrl) {
          console.log('[RetryAccess] Using direct URL as final fallback');
          setAccessUrl(fallbackUrl);
          setDownloadMethod('direct');
          updateMethodStatus('direct', true);
          
          toast({
            title: "Limited access restored",
            description: "Using direct file access as fallback. Some features may be limited.",
            variant: "destructive"
          });
          
          // Still return true since we have a fallback URL
          return true;
        }
        
        toast({
          title: "Retry failed",
          description: lastError ? `Error: ${lastError.message || 'Unknown error'}` : "Unable to access the file using any method. Please try again later.",
          variant: "destructive"
        });
      }
      
      return succeeded;
    } catch (error) {
      console.error("[RetryAccess] Error retrying file access:", error);
      setHasError(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    directUrl,
    retryAccess
  };
}
