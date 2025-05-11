
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
    setIsLoading, // Changed from setLoading to setIsLoading
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
      
      for (const methodToTry of methodsToTry) {
        if (succeeded) break;
        
        try {
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
            break;
          }
        } catch (methodError) {
          console.error(`Error trying ${methodToTry} method:`, methodError);
          updateMethodStatus(methodToTry, false);
        }
      }
      
      if (!succeeded) {
        setHasError(true);
        toast({
          title: "Retry failed",
          description: "Unable to access the file using any method. Please try again later.",
          variant: "destructive"
        });
      }
      
      return succeeded;
    } catch (error) {
      console.error("Error retrying file access:", error);
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
