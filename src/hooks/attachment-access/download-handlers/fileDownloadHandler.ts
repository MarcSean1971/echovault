
import { toast } from "@/components/ui/use-toast";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { DownloadHandlerProps } from "./types";

/**
 * Handles file download operations
 */
export function useFileDownloadHandler({ props, utilities }: DownloadHandlerProps) {
  const {
    filePath,
    fileName,
    fileType
  } = props;
  
  const {
    updateMethodStatus,
    setLoading,
    setHasError,
    setDownloadActive,
    setDownloadMethod,
    setAccessUrl
  } = utilities;
  
  // Create file access manager
  const fileAccessManager = new FileAccessManager(filePath, props.deliveryId, props.recipientEmail);
  
  // Get direct public URL (for direct access option)
  const directUrl = fileAccessManager.getDirectUrl();
  
  const downloadFile = async (method: AccessMethod) => {
    setLoading(true);
    setDownloadActive(true);
    
    try {
      console.log("Starting file download with method:", method);
      
      // IMPORTANT: Explicitly use Edge Function with download mode for secure downloads
      if (method === 'secure' && props.deliveryId && props.recipientEmail) {
        console.log("Using edge function with explicit download mode");
        
        // Get URL with download flag set to true
        const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('secure', 'download');
        
        if (url && resultMethod) {
          console.log("Download URL obtained from edge function:", url);
          
          // Add timestamp to URL to prevent caching
          const timestamp = Date.now();
          const timeStampedUrl = url.includes('?') 
            ? `${url}&t=${timestamp}&forceDownload=true` 
            : `${url}?t=${timestamp}&forceDownload=true`;
          
          console.log(`Actual download URL with timestamp: ${timeStampedUrl}`);
          
          FileAccessManager.executeDownload(timeStampedUrl, fileName, fileType, 'secure');
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
          
          if (fallbackMethod === 'secure' && props.deliveryId && props.recipientEmail) {
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

  return {
    directUrl,
    downloadFile
  };
}
