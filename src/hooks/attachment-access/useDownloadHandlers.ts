import { toast } from "@/components/ui/use-toast";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { AttachmentAccessProps, AttachmentAccessUtilities } from "./types";

/**
 * Hook for handling file download operations
 */
export function useDownloadHandlers(
  {
    filePath,
    fileName,
    fileType,
    deliveryId,
    recipientEmail
  }: AttachmentAccessProps,
  utilities: AttachmentAccessUtilities
) {
  const {
    updateMethodStatus,
    setLoading,
    setHasError,
    setDownloadActive,
    incrementRetryCount,
    setAccessUrl,
    setDownloadMethod
  } = utilities;
  
  // Create file access manager
  const fileAccessManager = new FileAccessManager(filePath, deliveryId, recipientEmail);
  
  // Get direct public URL (for direct access option)
  const directUrl = fileAccessManager.getDirectUrl();

  const downloadFile = async (method: AccessMethod) => {
    setLoading(true);
    setDownloadActive(true);
    
    try {
      console.log("Starting file download with method:", method);
      
      // IMPORTANT: Explicitly use Edge Function with download mode for secure downloads
      if (method === 'secure' && deliveryId && recipientEmail) {
        console.log("Using edge function with explicit download mode");
        
        // Get URL with download flag set to true
        const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('secure', 'download');
        
        if (url && resultMethod) {
          console.log("Download URL obtained from edge function:", url);
          FileAccessManager.executeDownload(url, fileName, fileType, 'secure');
          updateMethodStatus('secure', true);
          setHasError(false);
          return true;
        } else {
          updateMethodStatus('secure', false);
        }
      }
      
      // For non-secure methods, try to get a URL with download flag
      let result;
      let methodUsed: AccessMethod | null = null;
      
      if (method === 'signed') {
        const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('signed', 'download');
        result = url;
        methodUsed = resultMethod;
      } else if (method === 'direct') {
        result = directUrl;
        methodUsed = 'direct';
      }
      
      if (result && methodUsed) {
        console.log(`Download URL obtained using ${methodUsed} method:`, result);
        FileAccessManager.executeDownload(result, fileName, fileType, methodUsed);
        updateMethodStatus(methodUsed, true);
        setHasError(false);
        return true;
      } else {
        if (method === 'signed' || method === 'direct') {
          updateMethodStatus(method, false);
        }
      }
      
      // If current method fails, try alternatives in order of security
      const fallbackMethods: AccessMethod[] = ['secure', 'signed', 'direct']
        .filter(m => m !== method) as AccessMethod[];
      
      for (const fallbackMethod of fallbackMethods) {
        try {
          let fallbackUrl = null;
          let actualMethod: AccessMethod | null = null;
          
          if (fallbackMethod === 'secure' && deliveryId && recipientEmail) {
            const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('secure', 'download');
            fallbackUrl = url;
            actualMethod = resultMethod;
          } else if (fallbackMethod === 'signed') {
            const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('signed', 'download');
            fallbackUrl = url;
            actualMethod = resultMethod;
          } else if (fallbackMethod === 'direct') {
            fallbackUrl = directUrl;
            actualMethod = 'direct';
          }
          
          if (fallbackUrl && actualMethod) {
            console.log(`Fallback download URL obtained using ${actualMethod}:`, fallbackUrl);
            FileAccessManager.executeDownload(fallbackUrl, fileName, fileType, actualMethod);
            setDownloadMethod(actualMethod);
            setHasError(false);
            updateMethodStatus(actualMethod, true);
            toast({
              title: "Using fallback method",
              description: `Switched to ${actualMethod === 'secure' ? 'Edge Function' : 
                actualMethod === 'signed' ? 'Signed URL' : 'Direct URL'} after primary method failed`,
            });
            return true;
          } else {
            updateMethodStatus(fallbackMethod, false);
          }
        } catch (fallbackError) {
          console.error(`Error with fallback method ${fallbackMethod}:`, fallbackError);
          updateMethodStatus(fallbackMethod, false);
        }
      }
      
      // If all methods fail, show error
      setHasError(true);
      toast({
        title: "Download Error",
        description: "Could not access the file using any method. Please try again or contact support.",
        variant: "destructive"
      });
      return false;
    } catch (error) {
      console.error("Error downloading attachment:", error);
      setHasError(true);
      toast({
        title: "Error",
        description: "An error occurred while trying to download the attachment",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

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

  const tryDirectAccess = () => {
    if (directUrl) {
      window.open(directUrl, '_blank');
      setDownloadMethod('direct');
      updateMethodStatus('direct', true);
      toast({
        title: "Direct URL Test",
        description: "Opening direct URL without security checks"
      });
      return true;
    } else {
      updateMethodStatus('direct', false);
      toast({
        title: "Error",
        description: "Could not generate direct URL",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const retryAccess = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  return {
    directUrl,
    downloadFile,
    openFile,
    tryDirectAccess,
    retryAccess
  };
}
