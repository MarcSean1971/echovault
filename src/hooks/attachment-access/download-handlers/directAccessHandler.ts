
import { toast } from "@/components/ui/use-toast";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { DownloadHandlerProps } from "./types";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handler for direct file access (when secure methods fail)
 */
export function useDirectAccessHandler({ props, utilities }: DownloadHandlerProps) {
  const {
    filePath,
  } = props;
  
  const {
    updateMethodStatus,
    setHasError,
    incrementRetryCount,
    setAccessUrl
  } = utilities;
  
  // Create file access manager
  const fileAccessManager = new FileAccessManager(filePath, props.deliveryId, props.recipientEmail);
  
  // Get direct URL for immediate access
  const directUrl = fileAccessManager.getDirectUrl();
  
  // Try to use direct access as fallback
  const tryDirectAccess = async () => {
    try {
      incrementRetryCount();
      console.log(`[DirectAccessHandler] Attempting direct access as fallback for ${filePath}`);
      
      // Check if we're authenticated and no delivery ID is provided
      // This means we're viewing in authenticated context
      if (!props.deliveryId) {
        // Get current user session
        const { data: sessionData } = await supabase.auth.getSession();
        const isAuthenticated = !!sessionData.session?.access_token;
        
        if (isAuthenticated) {
          console.log("[DirectAccessHandler] Using authenticated access with signed URL");
          // Use signed URL method for authenticated user
          const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('signed');
          
          if (url) {
            updateMethodStatus('signed', true);
            setHasError(false);
            setAccessUrl(url);
            return { success: true, url, method: 'signed' as AccessMethod };
          }
        }
      }
      
      // Try direct access method
      if (directUrl) {
        console.log("[DirectAccessHandler] Using direct public URL access");
        updateMethodStatus('direct', true);
        setHasError(false);
        setAccessUrl(directUrl);
        return { success: true, url: directUrl, method: 'direct' as AccessMethod };
      }
      
      setHasError(true);
      toast({
        title: "Access error",
        description: "Could not access file via direct method",
        variant: "destructive"
      });
      return { success: false, url: null, method: null };
    } catch (error) {
      console.error("Error using direct access:", error);
      setHasError(true);
      return { success: false, url: null, method: null };
    }
  };

  return {
    directUrl,
    tryDirectAccess
  };
}
