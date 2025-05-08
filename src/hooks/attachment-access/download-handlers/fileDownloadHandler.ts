
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
      
      // For secure downloads using Edge Function
      if (method === 'secure' && props.deliveryId && props.recipientEmail) {
        console.log("Using edge function with explicit download mode");
        
        // Get URL with download flag set to true
        const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('secure', 'download');
        
        if (url && resultMethod) {
          console.log("Download URL obtained from edge function:", url);
          
          // Create clean URL with necessary parameters
          const urlObj = new URL(url);
          urlObj.searchParams.append('download-file', 'true');
          urlObj.searchParams.append('mode', 'download');
          
          console.log(`Actual download URL: ${urlObj.toString()}`);
          
          FileAccessManager.executeDownload(urlObj.toString(), fileName, fileType, 'secure');
          updateMethodStatus('secure', true);
          setHasError(false);
          return true;
        } else {
          updateMethodStatus('secure', false);
        }
      }
      
      // For non-secure methods
      if (method === 'signed') {
        const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('signed', 'download');
        if (url && resultMethod) {
          FileAccessManager.executeDownload(url, fileName, fileType, resultMethod);
          updateMethodStatus(resultMethod, true);
          setHasError(false);
          return true;
        }
        updateMethodStatus('signed', false);
      } else if (method === 'direct' && directUrl) {
        FileAccessManager.executeDownload(directUrl, fileName, fileType, 'direct');
        updateMethodStatus('direct', true);
        setHasError(false);
        return true;
      }
      
      // If current method fails, try one fallback
      const fallbackMethod: AccessMethod = method === 'secure' ? 'signed' : 
                                           method === 'signed' ? 'direct' : 'signed';
      
      try {
        if (fallbackMethod === 'secure' && props.deliveryId && props.recipientEmail) {
          const { url } = await fileAccessManager.getAccessUrl('secure', 'download');
          if (url) {
            console.log(`Using fallback secure method`);
            FileAccessManager.executeDownload(url, fileName, fileType, 'secure');
            setDownloadMethod('secure');
            updateMethodStatus('secure', true);
            setHasError(false);
            
            toast({
              title: "Using fallback method",
              description: "Switched to Edge Function after primary method failed",
            });
            return true;
          }
        } else if (fallbackMethod === 'signed') {
          const { url } = await fileAccessManager.getAccessUrl('signed', 'download');
          if (url) {
            console.log(`Using fallback signed method`);
            FileAccessManager.executeDownload(url, fileName, fileType, 'signed');
            setDownloadMethod('signed');
            updateMethodStatus('signed', true);
            setHasError(false);
            
            toast({
              title: "Using fallback method",
              description: "Switched to Signed URL after primary method failed",
            });
            return true;
          }
        } else if (fallbackMethod === 'direct' && directUrl) {
          console.log(`Using fallback direct method`);
          FileAccessManager.executeDownload(directUrl, fileName, fileType, 'direct');
          setDownloadMethod('direct');
          updateMethodStatus('direct', true);
          setHasError(false);
          
          toast({
            title: "Using fallback method",
            description: "Switched to Direct URL after primary method failed",
          });
          return true;
        }
      } catch (fallbackError) {
        console.error(`Fallback method ${fallbackMethod} also failed:`, fallbackError);
      }
      
      // If all methods fail, show error
      setHasError(true);
      toast({
        title: "Download Error",
        description: "Could not access the file. Please try a different download method.",
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
