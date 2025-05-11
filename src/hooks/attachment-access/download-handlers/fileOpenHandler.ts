
import { toast } from "@/components/ui/use-toast";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { AccessMode } from "@/components/message/detail/attachment/types";
import { DownloadHandlerProps } from "./types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles file opening operations
 */
export function useFileOpenHandler({ props, utilities }: DownloadHandlerProps) {
  const {
    filePath,
    fileName,
    fileType
  } = props;
  
  const {
    updateMethodStatus,
    setLoading,
    setHasError,
    setAccessUrl,
    setDownloadActive
  } = utilities;
  
  // Create file access manager
  const fileAccessManager = new FileAccessManager(filePath, props.deliveryId, props.recipientEmail);
  
  // Open file in new tab
  const openFile = async (method = 'secure') => {
    try {
      setLoading(true);
      console.log(`[FileOpenHandler] Opening file ${fileName} using ${method} method`);
      
      // Check if we're authenticated and no delivery ID is provided
      if (!props.deliveryId) {
        // Get current user session
        const { data: sessionData } = await supabase.auth.getSession();
        const isAuthenticated = !!sessionData.session?.access_token;
        
        if (isAuthenticated) {
          console.log("[FileOpenHandler] Using authenticated access instead of delivery-based access");
          
          // Use signed URL method for authenticated user
          const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('signed', 'view');
          
          if (url) {
            console.log(`[FileOpenHandler] Opening URL with auth: ${url}`);
            await FileAccessManager.openFile(url, fileName, fileType);
            updateMethodStatus('signed', true);
            setHasError(false);
            setAccessUrl(url);
            return true;
          }
          
          // Try direct URL as fallback
          const directUrl = fileAccessManager.getDirectUrl();
          if (directUrl) {
            console.log("[FileOpenHandler] Using direct URL fallback for authenticated user");
            await FileAccessManager.openFile(directUrl, fileName, fileType);
            updateMethodStatus('direct', true);
            setHasError(false);
            setAccessUrl(directUrl);
            return true;
          }
        }
      }
      
      // Original code for delivery-based access
      // For secure access with delivery ID and recipient (works for public access)
      if (method === 'secure' && props.deliveryId && props.recipientEmail) {
        console.log(`[FileOpenHandler] Attempting secure access with delivery: ${props.deliveryId.substring(0, 8)}...`);
        const { url, method: resultMethod } = await fileAccessManager.getAccessUrl(method, 'view');
        
        if (url && resultMethod) {
          console.log(`[FileOpenHandler] Opening URL: ${url}`);
          await FileAccessManager.openFile(url, fileName, fileType);
          updateMethodStatus(resultMethod, true);
          setHasError(false);
          setAccessUrl(url);
          return true;
        } else {
          console.warn("[FileOpenHandler] Failed to get secure URL, trying signed URL");
        }
      }
      
      // Try signed URL method
      if (method === 'signed' || method === 'secure') {
        console.log("[FileOpenHandler] Attempting signed URL access");
        const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('signed', 'view');
        if (url && resultMethod) {
          await FileAccessManager.openFile(url, fileName, fileType);
          updateMethodStatus(resultMethod, true);
          setHasError(false);
          setAccessUrl(url);
          return true;
        } else {
          console.warn("[FileOpenHandler] Failed to get signed URL, trying direct URL");
        }
      }
      
      // Last resort - direct URL
      console.log("[FileOpenHandler] Attempting direct URL access");
      const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('direct', 'view');
      if (url && resultMethod) {
        await FileAccessManager.openFile(url, fileName, fileType);
        updateMethodStatus(resultMethod, true);
        setHasError(false);
        setAccessUrl(url);
        return true;
      }
      
      setHasError(true);
      toast({
        title: "Cannot Open File",
        description: "Unable to generate a valid URL to open this file.",
        variant: "destructive"
      });
      return false;
    } catch (error) {
      console.error("Error opening file:", error);
      setHasError(true);
      toast({
        title: "Error",
        description: "An error occurred while trying to open the file",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
      setDownloadActive(false);
    }
  };

  return {
    openFile
  };
}
