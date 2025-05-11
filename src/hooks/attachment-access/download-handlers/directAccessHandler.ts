
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
    setAccessUrl,
    setIsLoading,
  } = utilities;
  
  // Create file access manager
  const fileAccessManager = new FileAccessManager(filePath, props.deliveryId, props.recipientEmail);
  
  // Get direct URL for immediate access
  const directUrl = fileAccessManager.getDirectUrl();
  
  // Try to use direct access as fallback
  const tryDirectAccess = async () => {
    try {
      setIsLoading(true);
      incrementRetryCount();
      
      console.log(`[DirectAccessHandler] Attempting direct access for ${filePath}`);
      console.log(`[DirectAccessHandler] Delivery ID: ${props.deliveryId || 'Not provided'}`);
      console.log(`[DirectAccessHandler] Recipient: ${props.recipientEmail || 'Not provided'}`);
      
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
            console.log("[DirectAccessHandler] Successfully obtained signed URL in authenticated context");
            updateMethodStatus('signed', true);
            setHasError(false);
            setAccessUrl(url);
            return { success: true, url, method: 'signed' as AccessMethod };
          } else {
            console.warn("[DirectAccessHandler] Failed to get signed URL in authenticated context");
          }
        } else {
          console.log("[DirectAccessHandler] Not authenticated and no delivery context");
        }
      }
      
      // Try direct access method if signed URL fails or in public context
      if (directUrl) {
        console.log("[DirectAccessHandler] Using direct public URL access");
        updateMethodStatus('direct', true);
        setHasError(false);
        setAccessUrl(directUrl);
        
        // Show success toast
        toast({
          title: "Direct access successful",
          description: "Switched to direct URL access method",
        });
        
        return { success: true, url: directUrl, method: 'direct' as AccessMethod };
      }
      
      // If no direct URL is available, try one more time with secure method
      if (props.deliveryId && props.recipientEmail) {
        console.log("[DirectAccessHandler] Trying secure method as last resort");
        const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('secure');
        
        if (url && resultMethod) {
          updateMethodStatus(resultMethod, true);
          setHasError(false);
          setAccessUrl(url);
          return { success: true, url, method: resultMethod };
        }
      }
      
      setHasError(true);
      toast({
        title: "Access error",
        description: "Could not access file via any method",
        variant: "destructive"
      });
      return { success: false, url: null, method: null };
    } catch (error) {
      console.error("Error using direct access:", error);
      setHasError(true);
      toast({
        title: "Access error",
        description: "An error occurred while trying to access the file directly",
        variant: "destructive"
      });
      return { success: false, url: null, method: null };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    directUrl,
    tryDirectAccess
  };
}
