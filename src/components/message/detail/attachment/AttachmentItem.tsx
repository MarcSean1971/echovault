
import React, { useState, useEffect } from "react";
import { FileIcon, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessMethod, AccessMode, AttachmentProps } from "./types";
import { formatFileSize } from "@/utils/fileUtils";
import { FileAccessManager } from "@/services/messages/fileAccessManager";
import { AttachmentBadge } from "./AttachmentBadge";
import { 
  MethodToggleButton, 
  DebugButton, 
  DirectAccessButton,
  RetryButton,
  DownloadButton,
  OpenButton
} from "./AccessButtons";
import { DebugInfo } from "./DebugInfo";
import { StatusBadge } from "@/components/ui/status-badge";

interface AttachmentItemProps {
  attachment: AttachmentProps;
  deliveryId?: string;
  recipientEmail?: string;
}

export function AttachmentItem({ attachment, deliveryId, recipientEmail }: AttachmentItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const [downloadMethod, setDownloadMethod] = useState<AccessMethod>('secure');
  const [lastSuccessMethod, setLastSuccessMethod] = useState<AccessMethod | null>(null);
  const [downloadActive, setDownloadActive] = useState(false);
  const [attemptedMethods, setAttemptedMethods] = useState<{[key in AccessMethod]?: boolean}>({});
  const [currentMethodStatus, setCurrentMethodStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Create file access manager
  const fileAccessManager = new FileAccessManager(attachment.path, deliveryId, recipientEmail);
  
  // Get direct public URL (for direct access option)
  const directUrl = fileAccessManager.getDirectUrl();

  useEffect(() => {
    // Reset download active state after a short period
    if (downloadActive) {
      const timer = setTimeout(() => {
        setDownloadActive(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [downloadActive]);

  // Update method status when methods change
  useEffect(() => {
    setCurrentMethodStatus(lastSuccessMethod === downloadMethod ? 'success' : hasError ? 'error' : 'idle');
  }, [downloadMethod, lastSuccessMethod, hasError]);

  const updateMethodStatus = (method: AccessMethod, success: boolean) => {
    setAttemptedMethods(prev => ({...prev, [method]: true}));
    if (success) {
      setCurrentMethodStatus('success');
      setLastSuccessMethod(method);
    } else {
      if (method === downloadMethod) {
        setCurrentMethodStatus('error');
      }
    }
  };

  const retryAccess = async () => {
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    
    try {
      // Define an array of methods to try, explicitly typed as AccessMethod[]
      const methodsToTry: AccessMethod[] = ['secure', 'signed', 'direct'];
      
      // Reorder to try methods in different order
      const currentIndex = methodsToTry.indexOf(downloadMethod);
      if (currentIndex !== -1) {
        methodsToTry.splice(currentIndex, 1);
        methodsToTry.unshift(downloadMethod);
      }
      
      let succeeded = false;
      
      for (const methodToTry of methodsToTry) {
        if (succeeded) break;
        
        try {
          const { url, method } = await fileAccessManager.getAccessUrl(methodToTry);
          
          if (url && method) {
            setHasError(false);
            setAccessUrl(url);
            setDownloadMethod(method);
            
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
        setHasError(true);
        toast({
          title: "Retry failed",
          description: "Unable to access the file using any method. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error retrying file access:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDownloadMethod = () => {
    // Cycle through the methods: secure -> signed -> direct -> secure
    const methods: AccessMethod[] = ['secure', 'signed', 'direct'];
    const currentIndex = methods.indexOf(downloadMethod);
    const nextMethod = methods[(currentIndex + 1) % methods.length];
    
    setDownloadMethod(nextMethod);
    toast({
      title: `Switched to ${nextMethod === 'secure' ? 'Edge Function' : nextMethod === 'signed' ? 'Signed URL' : 'Direct URL'}`,
      description: `Now using ${nextMethod === 'secure' ? 'Edge Function' : nextMethod === 'signed' ? 'Signed URL' : 'Direct URL'} for file access`,
    });
    
    // Reset status when manually changing method
    setCurrentMethodStatus(lastSuccessMethod === nextMethod ? 'success' : 'idle');
  };

  const downloadFile = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setDownloadActive(true);
      console.log("Starting file download with method:", downloadMethod);
      
      // IMPORTANT: Explicitly use Edge Function with download mode for secure downloads
      if (downloadMethod === 'secure' && deliveryId && recipientEmail) {
        console.log("Using edge function with explicit download mode");
        
        // Get URL with download flag set to true
        const { url, method } = await fileAccessManager.getAccessUrl('secure', 'download');
        
        if (url && method) {
          console.log("Download URL obtained from edge function:", url);
          FileAccessManager.executeDownload(url, attachment.name, attachment.type, 'secure');
          updateMethodStatus('secure', true);
          setHasError(false);
          return;
        } else {
          updateMethodStatus('secure', false);
        }
      }
      
      // For non-secure methods, try to get a URL with download flag
      let result;
      let methodUsed: AccessMethod | null = null;
      
      if (downloadMethod === 'signed') {
        const { url, method } = await fileAccessManager.getAccessUrl('signed', 'download');
        result = url;
        methodUsed = method;
      } else if (downloadMethod === 'direct') {
        result = directUrl;
        methodUsed = 'direct';
      }
      
      if (result && methodUsed) {
        console.log(`Download URL obtained using ${methodUsed} method:`, result);
        FileAccessManager.executeDownload(result, attachment.name, attachment.type, methodUsed);
        updateMethodStatus(methodUsed, true);
        setHasError(false);
        return;
      } else {
        if (downloadMethod === 'signed' || downloadMethod === 'direct') {
          updateMethodStatus(downloadMethod, false);
        }
      }
      
      // If current method fails, try alternatives in order of security
      const fallbackMethods: AccessMethod[] = ['secure', 'signed', 'direct'].filter(m => m !== downloadMethod) as AccessMethod[];
      
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
            FileAccessManager.executeDownload(fallbackUrl, attachment.name, attachment.type, actualMethod);
            setDownloadMethod(actualMethod);
            updateMethodStatus(actualMethod, true);
            toast({
              title: "Using fallback method",
              description: `Switched to ${actualMethod === 'secure' ? 'Edge Function' : 
                actualMethod === 'signed' ? 'Signed URL' : 'Direct URL'} after primary method failed`,
            });
            setHasError(false);
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
      setHasError(true);
      toast({
        title: "Download Error",
        description: "Could not access the file using any method. Please try again or contact support.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error downloading attachment:", error);
      setHasError(true);
      toast({
        title: "Error",
        description: "An error occurred while trying to download the attachment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openFile = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const { url, method } = await fileAccessManager.getAccessUrl(downloadMethod);
      
      if (url && method) {
        // For opening in a new tab
        window.open(url, '_blank');
        updateMethodStatus(method, true);
        setHasError(false);
        return;
      } else {
        updateMethodStatus(downloadMethod, false);
      }
      
      // Try alternatives if current method fails
      const alternativeMethods: AccessMethod[] = ['secure', 'signed', 'direct'].filter(m => m !== downloadMethod) as AccessMethod[];
      
      for (const alternativeMethod of alternativeMethods) {
        try {
          const { url: alternativeUrl, method: altMethod } = await fileAccessManager.getAccessUrl(alternativeMethod);
          
          if (alternativeUrl && altMethod) {
            window.open(alternativeUrl, '_blank');
            setDownloadMethod(alternativeMethod);
            updateMethodStatus(altMethod, true);
            
            toast({
              title: "Using alternative method",
              description: `Switched to ${alternativeMethod === 'secure' ? 'Edge Function' : alternativeMethod === 'signed' ? 'Signed URL' : 'Direct URL'} for viewing`,
            });
            setHasError(false);
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
      setHasError(true);
      toast({
        title: "Access Error",
        description: "Could not access the file using any method. Please try again or contact support.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error opening attachment:", error);
      setHasError(true);
      toast({
        title: "Error",
        description: "An error occurred while trying to access the attachment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test function to try direct URL access
  const tryDirectAccess = () => {
    if (directUrl) {
      window.open(directUrl, '_blank');
      setDownloadMethod('direct');
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
    setShowDebug(prev => !prev);
  };
  
  const getMethodStatusBadge = () => {
    if (currentMethodStatus === 'success') {
      return (
        <StatusBadge status="success" size="sm" showIcon className="ml-2">
          Success
        </StatusBadge>
      );
    } else if (currentMethodStatus === 'error') {
      return (
        <StatusBadge status="warning" size="sm" showIcon className="ml-2">
          Failed
        </StatusBadge>
      );
    }
    return null;
  };

  const getFallbackInfoBadge = () => {
    if (lastSuccessMethod && lastSuccessMethod !== downloadMethod) {
      return (
        <StatusBadge status="info" size="sm" showIcon className="ml-2">
          Using fallback
        </StatusBadge>
      );
    }
    return null;
  };
  
  return (
    <div className={`border rounded-md p-3 transition-all duration-200 hover:shadow-md ${hasError ? 'border-red-300 bg-red-50' : 'hover:border-primary/20'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          {hasError ? (
            <AlertCircle className={`h-4 w-4 text-red-500 flex-shrink-0 ${HOVER_TRANSITION}`} />
          ) : (
            <FileIcon className={`h-4 w-4 flex-shrink-0 ${HOVER_TRANSITION}`} />
          )}
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="block truncate">{attachment.name}</span>
            </div>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <AttachmentBadge method={downloadMethod} />
              {getMethodStatusBadge()}
              {getFallbackInfoBadge()}
              <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {/* Toggle download method */}
          <MethodToggleButton 
            downloadMethod={downloadMethod} 
            isLoading={isLoading} 
            toggleDownloadMethod={toggleDownloadMethod} 
          />

          {/* Debug toggle */}
          <DebugButton 
            isLoading={isLoading}
            toggleDebug={toggleDebug}
          />
          
          {/* Direct access button */}
          <DirectAccessButton 
            isLoading={isLoading}
            tryDirectAccess={tryDirectAccess}
          />

          {/* Download button - always show, retry on error */}
          <DownloadButton
            isLoading={isLoading}
            downloadActive={downloadActive}
            downloadFile={downloadFile}
            downloadMethod={downloadMethod}
          />
          
          {/* Open button */}
          <OpenButton 
            isLoading={isLoading}
            hasError={hasError}
            onClick={openFile}
          />
        </div>
      </div>
      
      {hasError && (
        <div className="mt-2 text-xs text-red-600">
          There was an error accessing this file. Please try the direct URL option or contact the sender.
          {retryCount > 0 && (
            <span className="block mt-1">
              Retried {retryCount} time{retryCount !== 1 ? 's' : ''} without success.
            </span>
          )}
        </div>
      )}

      {(showDebug || hasError) && (
        <DebugInfo
          downloadMethod={downloadMethod}
          lastSuccessMethod={lastSuccessMethod}
          attachmentPath={attachment.path}
          deliveryId={deliveryId}
          recipientEmail={recipientEmail}
          accessUrl={accessUrl}
          directUrl={directUrl}
          retryCount={retryCount}
          hasError={hasError}
          attemptedMethods={attemptedMethods}
        />
      )}
    </div>
  );
}
