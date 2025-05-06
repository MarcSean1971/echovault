
import { toast } from "@/components/ui/use-toast";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { DownloadHandlerProps } from "./types";

/**
 * Handles direct access to files
 */
export function useDirectAccessHandler({ props, utilities }: DownloadHandlerProps) {
  const {
    filePath
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

  return {
    directUrl,
    tryDirectAccess
  };
}
