
import { toast } from "@/components/ui/use-toast";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { AccessMode } from "@/components/message/detail/attachment/types";
import { DownloadHandlerProps } from "./types";

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
  const openFile = async (method = props.preferredMethod || 'secure') => {
    try {
      setLoading(true);
      console.log(`[FileOpenHandler] Opening file ${fileName} using ${method} method`);
      
      if (method === 'secure' && props.deliveryId && props.recipientEmail) {
        const { url, method: resultMethod } = await fileAccessManager.getAccessUrl(method, 'view');
        
        if (url && resultMethod) {
          console.log(`[FileOpenHandler] Opening URL: ${url}`);
          await FileAccessManager.openFile(url, fileName, fileType);
          updateMethodStatus(resultMethod, true);
          setHasError(false);
          setAccessUrl(url);
          return true;
        }
      }
      
      if (method === 'signed') {
        const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('signed', 'view');
        if (url && resultMethod) {
          await FileAccessManager.openFile(url, fileName, fileType);
          updateMethodStatus(resultMethod, true);
          setHasError(false);
          setAccessUrl(url);
          return true;
        }
      }
      
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
