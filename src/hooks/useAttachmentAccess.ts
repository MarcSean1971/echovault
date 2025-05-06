import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { AccessMethod, AccessMode } from "@/components/message/detail/attachment/types";
import { FileAccessManager } from "@/services/messages/fileAccess";

interface UseAttachmentAccessProps {
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  deliveryId?: string;
  recipientEmail?: string;
}

interface AttachmentAccessState {
  isLoading: boolean;
  hasError: boolean;
  retryCount: number;
  showDebug: boolean;
  accessUrl: string | null;
  downloadMethod: AccessMethod;
  lastSuccessMethod: AccessMethod | null;
  downloadActive: boolean;
  attemptedMethods: {[key in AccessMethod]?: boolean};
  currentMethodStatus: 'idle' | 'success' | 'error';
}

export function useAttachmentAccess({
  filePath,
  fileName,
  fileType,
  fileSize,
  deliveryId,
  recipientEmail
}: UseAttachmentAccessProps) {
  // State management
  const [state, setState] = useState<AttachmentAccessState>({
    isLoading: false,
    hasError: false,
    retryCount: 0,
    showDebug: false,
    accessUrl: null,
    downloadMethod: 'secure',
    lastSuccessMethod: null,
    downloadActive: false,
    attemptedMethods: {},
    currentMethodStatus: 'idle'
  });
  
  // Create file access manager
  const fileAccessManager = new FileAccessManager(filePath, deliveryId, recipientEmail);
  
  // Get direct public URL (for direct access option)
  const directUrl = fileAccessManager.getDirectUrl();

  // Update download active state after a short period
  useEffect(() => {
    if (state.downloadActive) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, downloadActive: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.downloadActive]);

  // Update method status when methods change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentMethodStatus: prev.lastSuccessMethod === prev.downloadMethod 
        ? 'success' 
        : prev.hasError 
          ? 'error' 
          : 'idle'
    }));
  }, [state.downloadMethod, state.lastSuccessMethod, state.hasError]);

  const updateMethodStatus = (method: AccessMethod, success: boolean) => {
    setState(prev => {
      const newState = { 
        ...prev,
        attemptedMethods: { ...prev.attemptedMethods, [method]: true }
      };
      
      if (success) {
        newState.currentMethodStatus = 'success';
        newState.lastSuccessMethod = method;
      } else if (method === prev.downloadMethod) {
        newState.currentMethodStatus = 'error';
      }
      
      return newState;
    });
  };

  const retryAccess = async () => {
    setState(prev => ({ ...prev, isLoading: true, retryCount: prev.retryCount + 1 }));
    
    try {
      // Define an array of methods to try, explicitly typed as AccessMethod[]
      const methodsToTry: AccessMethod[] = ['secure', 'signed', 'direct'];
      
      // Reorder to try methods in different order
      const currentIndex = methodsToTry.indexOf(state.downloadMethod);
      if (currentIndex !== -1) {
        methodsToTry.splice(currentIndex, 1);
        methodsToTry.unshift(state.downloadMethod);
      }
      
      let succeeded = false;
      
      for (const methodToTry of methodsToTry) {
        if (succeeded) break;
        
        try {
          const { url, method } = await fileAccessManager.getAccessUrl(methodToTry);
          
          if (url && method) {
            setState(prev => ({ 
              ...prev, 
              hasError: false,
              accessUrl: url,
              downloadMethod: method
            }));
            
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
        setState(prev => ({ ...prev, hasError: true }));
        toast({
          title: "Retry failed",
          description: "Unable to access the file using any method. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error retrying file access:", error);
      setState(prev => ({ ...prev, hasError: true }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const toggleDownloadMethod = () => {
    // Cycle through the methods: secure -> signed -> direct -> secure
    const methods: AccessMethod[] = ['secure', 'signed', 'direct'];
    const currentIndex = methods.indexOf(state.downloadMethod);
    const nextMethod = methods[(currentIndex + 1) % methods.length];
    
    setState(prev => ({ 
      ...prev, 
      downloadMethod: nextMethod,
      currentMethodStatus: prev.lastSuccessMethod === nextMethod ? 'success' : 'idle'
    }));
    
    toast({
      title: `Switched to ${nextMethod === 'secure' ? 'Edge Function' : nextMethod === 'signed' ? 'Signed URL' : 'Direct URL'}`,
      description: `Now using ${nextMethod === 'secure' ? 'Edge Function' : nextMethod === 'signed' ? 'Signed URL' : 'Direct URL'} for file access`,
    });
  };

  const downloadFile = async () => {
    if (state.isLoading) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true, downloadActive: true }));
      console.log("Starting file download with method:", state.downloadMethod);
      
      // IMPORTANT: Explicitly use Edge Function with download mode for secure downloads
      if (state.downloadMethod === 'secure' && deliveryId && recipientEmail) {
        console.log("Using edge function with explicit download mode");
        
        // Get URL with download flag set to true
        const { url, method } = await fileAccessManager.getAccessUrl('secure', 'download');
        
        if (url && method) {
          console.log("Download URL obtained from edge function:", url);
          FileAccessManager.executeDownload(url, fileName, fileType, 'secure');
          updateMethodStatus('secure', true);
          setState(prev => ({ ...prev, hasError: false }));
          return;
        } else {
          updateMethodStatus('secure', false);
        }
      }
      
      // For non-secure methods, try to get a URL with download flag
      let result;
      let methodUsed: AccessMethod | null = null;
      
      if (state.downloadMethod === 'signed') {
        const { url, method } = await fileAccessManager.getAccessUrl('signed', 'download');
        result = url;
        methodUsed = method;
      } else if (state.downloadMethod === 'direct') {
        result = directUrl;
        methodUsed = 'direct';
      }
      
      if (result && methodUsed) {
        console.log(`Download URL obtained using ${methodUsed} method:`, result);
        FileAccessManager.executeDownload(result, fileName, fileType, methodUsed);
        updateMethodStatus(methodUsed, true);
        setState(prev => ({ ...prev, hasError: false }));
        return;
      } else {
        if (state.downloadMethod === 'signed' || state.downloadMethod === 'direct') {
          updateMethodStatus(state.downloadMethod, false);
        }
      }
      
      // If current method fails, try alternatives in order of security
      const fallbackMethods: AccessMethod[] = ['secure', 'signed', 'direct'].filter(m => m !== state.downloadMethod) as AccessMethod[];
      
      for (const method of fallbackMethods) {
        try {
          let fallbackUrl = null;
          let actualMethod: AccessMethod | null = null;
          
          if (method === 'secure' && deliveryId && recipientEmail) {
            const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('secure', 'download');
            fallbackUrl = url;
            actualMethod = resultMethod;
          } else if (method === 'signed') {
            const { url, method: resultMethod } = await fileAccessManager.getAccessUrl('signed', 'download');
            fallbackUrl = url;
            actualMethod = resultMethod;
          } else if (method === 'direct') {
            fallbackUrl = directUrl;
            actualMethod = 'direct';
          }
          
          if (fallbackUrl && actualMethod) {
            console.log(`Fallback download URL obtained using ${actualMethod}:`, fallbackUrl);
            FileAccessManager.executeDownload(fallbackUrl, fileName, fileType, actualMethod);
            setState(prev => ({
              ...prev,
              downloadMethod: actualMethod,
              hasError: false
            }));
            updateMethodStatus(actualMethod, true);
            toast({
              title: "Using fallback method",
              description: `Switched to ${actualMethod === 'secure' ? 'Edge Function' : 
                actualMethod === 'signed' ? 'Signed URL' : 'Direct URL'} after primary method failed`,
            });
            return;
          } else {
            updateMethodStatus(method, false);
          }
        } catch (fallbackError) {
          console.error(`Error with fallback method ${method}:`, fallbackError);
          updateMethodStatus(method, false);
        }
      }
      
      // If all methods fail, show error
      setState(prev => ({ ...prev, hasError: true }));
      toast({
        title: "Download Error",
        description: "Could not access the file using any method. Please try again or contact support.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error downloading attachment:", error);
      setState(prev => ({ ...prev, hasError: true }));
      toast({
        title: "Error",
        description: "An error occurred while trying to download the attachment",
        variant: "destructive"
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const openFile = async () => {
    if (state.isLoading) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const { url, method } = await fileAccessManager.getAccessUrl(state.downloadMethod);
      
      if (url && method) {
        // For opening in a new tab
        window.open(url, '_blank');
        updateMethodStatus(method, true);
        setState(prev => ({ ...prev, hasError: false }));
        return;
      } else {
        updateMethodStatus(state.downloadMethod, false);
      }
      
      // Try alternatives if current method fails
      const alternativeMethods: AccessMethod[] = ['secure', 'signed', 'direct'].filter(m => m !== state.downloadMethod) as AccessMethod[];
      
      for (const alternativeMethod of alternativeMethods) {
        try {
          const { url: alternativeUrl, method: altMethod } = await fileAccessManager.getAccessUrl(alternativeMethod);
          
          if (alternativeUrl && altMethod) {
            window.open(alternativeUrl, '_blank');
            setState(prev => ({
              ...prev,
              downloadMethod: alternativeMethod,
              hasError: false
            }));
            updateMethodStatus(altMethod, true);
            
            toast({
              title: "Using alternative method",
              description: `Switched to ${alternativeMethod === 'secure' ? 'Edge Function' : alternativeMethod === 'signed' ? 'Signed URL' : 'Direct URL'} for viewing`,
            });
            return;
          } else {
            updateMethodStatus(alternativeMethod, false);
          }
        } catch (altError) {
          console.error(`Error with alternative method ${alternativeMethod}:`, altError);
          updateMethodStatus(alternativeMethod, false);
        }
      }
      
      // If all methods fail, show error
      setState(prev => ({ ...prev, hasError: true }));
      toast({
        title: "Access Error",
        description: "Could not access the file using any method. Please try again or contact support.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error opening attachment:", error);
      setState(prev => ({ ...prev, hasError: true }));
      toast({
        title: "Error",
        description: "An error occurred while trying to access the attachment",
        variant: "destructive"
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Test function to try direct URL access
  const tryDirectAccess = () => {
    if (directUrl) {
      window.open(directUrl, '_blank');
      setState(prev => ({ ...prev, downloadMethod: 'direct' }));
      updateMethodStatus('direct', true);
      toast({
        title: "Direct URL Test",
        description: "Opening direct URL without security checks"
      });
    } else {
      updateMethodStatus('direct', false);
      toast({
        title: "Error",
        description: "Could not generate direct URL",
        variant: "destructive"
      });
    }
  };
  
  const toggleDebug = () => {
    setState(prev => ({ ...prev, showDebug: !prev.showDebug }));
  };

  return {
    ...state,
    directUrl,
    retryAccess,
    toggleDownloadMethod,
    downloadFile,
    openFile,
    tryDirectAccess,
    toggleDebug
  };
}
