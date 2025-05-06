
import { toast } from "@/components/ui/use-toast";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { DownloadHandlerProps } from "./types";

/**
 * Handles direct access to files
 */
export function useDirectAccessHandler({ props, utilities }: DownloadHandlerProps) {
  const {
    filePath,
    fileName
  } = props;
  
  const {
    updateMethodStatus,
    setDownloadMethod
  } = utilities;
  
  // Create file access manager
  const fileAccessManager = new FileAccessManager(filePath, props.deliveryId, props.recipientEmail);
  
  // Get direct public URL (for direct access option)
  const directUrl = fileAccessManager.getDirectUrl();

  const tryDirectAccess = () => {
    if (!directUrl) {
      console.error(`[DirectAccess] No direct URL available for ${fileName || 'file'}`);
      updateMethodStatus('direct', false);
      toast({
        title: "Direct URL Error",
        description: "Could not generate a direct URL for this file. The storage bucket may not be public.",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      console.log(`[DirectAccess] Opening direct URL: ${directUrl}`);
      window.open(directUrl, '_blank');
      setDownloadMethod('direct');
      updateMethodStatus('direct', true);
      toast({
        title: "Direct URL Test",
        description: "Opening file with direct URL access"
      });
      return true;
    } catch (error) {
      console.error("[DirectAccess] Error opening direct URL:", error);
      updateMethodStatus('direct', false);
      toast({
        title: "Direct Access Failed",
        description: "Could not open the file using direct URL access",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    directUrl,
    tryDirectAccess
  };
}
