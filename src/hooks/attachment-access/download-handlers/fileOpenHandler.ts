
import { toast } from "@/components/ui/use-toast";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { DownloadHandlerProps } from "./types";

/**
 * Handles file opening operations
 */
export function useFileOpenHandler({ props, utilities }: DownloadHandlerProps) {
  const {
    filePath
  } = props;
  
  const {
    updateMethodStatus,
    setLoading,
    setHasError,
    setDownloadMethod
  } = utilities;
  
  // Create file access manager
  const fileAccessManager = new FileAccessManager(filePath, props.deliveryId, props.recipientEmail);
  
  // Get direct public URL (for direct access option)
  const directUrl = fileAccessManager.getDirectUrl();

  const openFile = async (method: AccessMethod) => {
    setLoading(true);
    
    try {
      const { url, method: resultMethod } = await fileAccessManager.getAccessUrl(method);
      
      if (url && resultMethod) {
        // For opening in a new tab
        window.open(url, '_blank');
        updateMethodStatus(resultMethod, true);
        setHasError(false);
        return true;
      } else {
        updateMethodStatus(method, false);
      }
      
      // Try alternatives if current method fails
      const alternativeMethods: AccessMethod[] = ['secure', 'signed', 'direct']
        .filter(m => m !== method) as AccessMethod[];
      
      for (const alternativeMethod of alternativeMethods) {
        try {
          const { url: alternativeUrl, method: altMethod } = await fileAccessManager.getAccessUrl(alternativeMethod);
          
          if (alternativeUrl && altMethod) {
            window.open(alternativeUrl, '_blank');
            setDownloadMethod(alternativeMethod);
            setHasError(false);
            updateMethodStatus(altMethod, true);
            
            toast({
              title: "Using alternative method",
              description: `Switched to ${alternativeMethod === 'secure' ? 'Edge Function' : alternativeMethod === 'signed' ? 'Signed URL' : 'Direct URL'} for viewing`,
            });
            return true;
          } else {
            updateMethodStatus(alternativeMethod, false);
          }
        } catch (altError) {
          console.error(`Error with alternative method ${alternativeMethod}:`, altError);
          updateMethodStatus(alternativeMethod, false);
        }
      }
      
      // If all methods fail, show error
      setHasError(true);
      toast({
        title: "Access Error",
        description: "Could not access the file using any method. Please try again or contact support.",
        variant: "destructive"
      });
      return false;
    } catch (error) {
      console.error("Error opening attachment:", error);
      setHasError(true);
      toast({
        title: "Error",
        description: "An error occurred while trying to access the attachment",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    directUrl,
    openFile
  };
}
