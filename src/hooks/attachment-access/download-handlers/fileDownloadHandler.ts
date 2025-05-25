
import { toast } from "@/components/ui/use-toast";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { DownloadHandlerProps } from "./types";
import { supabase } from "@/integrations/supabase/client";

// Helper function to normalize file paths
function normalizeFilePath(path: string): string {
  // Remove 'file/' prefix if present
  if (path.startsWith('file/')) {
    return path.substring(5);
  }
  return path;
}

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
    setIsLoading,
    setHasError,
    setDownloadActive,
    setDownloadMethod,
    setAccessUrl
  } = utilities;
  
  // Normalize file path before creating the access manager
  const normalizedPath = normalizeFilePath(filePath);
  console.log(`[FileDownloadHandler] Original path: ${filePath}, normalized: ${normalizedPath}`);
  
  // Create file access manager with normalized path
  const fileAccessManager = new FileAccessManager(normalizedPath, props.deliveryId, props.recipientEmail);
  
  // Get direct public URL (for direct access option)
  const directUrl = fileAccessManager.getDirectUrl();
  
  const downloadFile = async (method: AccessMethod) => {
    setIsLoading(true);
    setDownloadActive(true);
    
    try {
      console.log("Starting file download with method:", method);
      console.log(`[FileDownloadHandler] Using normalized path: ${normalizedPath}`);
      
      // Check if we're authenticated and no delivery ID is provided
      // This means we're viewing in authenticated context
      if (!props.deliveryId) {
        const { data: sessionData } = await supabase.auth.getSession();
        const isAuthenticated = !!sessionData.session?.access_token;
        
        if (isAuthenticated) {
          console.log("[FileDownloadHandler] Using authenticated access instead of delivery-based access");
          
          // Use signed URL method for authenticated user
          const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('signed', 'download');
          
          if (url) {
            console.log(`[FileDownloadHandler] Got authenticated URL: ${url}`);
            await FileAccessManager.executeDownload(url, fileName, fileType, 'signed');
            updateMethodStatus('signed', true);
            setHasError(false);
            return true;
          }
          
          // Try direct URL as fallback for authenticated user
          if (directUrl) {
            console.log("[FileDownloadHandler] Using direct URL fallback for authenticated user");
            await FileAccessManager.executeDownload(directUrl, fileName, fileType, 'direct');
            updateMethodStatus('direct', true);
            setHasError(false);
            return true;
          }
        }
      }
      
      // Original code for delivery-based access
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
          
          await FileAccessManager.executeDownload(urlObj.toString(), fileName, fileType, 'secure');
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
          await FileAccessManager.executeDownload(url, fileName, fileType, resultMethod);
          updateMethodStatus(resultMethod, true);
          setHasError(false);
          return true;
        }
        updateMethodStatus('signed', false);
      } else if (method === 'direct' && directUrl) {
        await FileAccessManager.executeDownload(directUrl, fileName, fileType, 'direct');
        updateMethodStatus('direct', true);
        setHasError(false);
        return true;
      }
      
      // If current method fails, try one fallback
      const fallbackMethod: AccessMethod = 
        method === 'secure' ? 'signed' : 
        method === 'signed' ? 'direct' : 'signed';
      
      try {
        if (fallbackMethod === 'signed') {
          const { url } = await fileAccessManager.getAccessUrl('signed', 'download');
          if (url) {
            console.log(`Using fallback signed method`);
            await FileAccessManager.executeDownload(url, fileName, fileType, 'signed');
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
          await FileAccessManager.executeDownload(directUrl, fileName, fileType, 'direct');
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
      
      // If all methods fail, provide a more helpful error message
      setHasError(true);
      toast({
        title: "Download Error",
        description: "Could not access the file. The file path format may be incorrect. Please try a different download method.",
        variant: "destructive"
      });
      return false;
    } catch (error) {
      console.error("Error downloading attachment:", error);
      setHasError(true);
      toast({
        title: "Error",
        description: "An error occurred while trying to download the attachment. Check the file path format.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
      // Reset downloadActive state after download completion (success or failure)
      setDownloadActive(false);
    }
  };

  return {
    directUrl,
    downloadFile
  };
}
