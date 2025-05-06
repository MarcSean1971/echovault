import React from "react";
import { FileIcon, AlertCircle } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AttachmentProps } from "./types";
import { formatFileSize } from "@/utils/fileUtils";
import { AttachmentBadge } from "./AttachmentBadge";
import { 
  MethodToggleButton, 
  DebugButton, 
  DirectAccessButton,
  DownloadButton,
  OpenButton,
  SecureDownloadButton
} from "./buttons";
import { DebugInfo } from "./DebugInfo";
import { useAttachmentAccess } from "@/hooks/useAttachmentAccess";
import { MethodStatusBadge, FallbackInfoBadge } from "./StatusBadges";
import { AttachmentErrorInfo } from "./AttachmentErrorInfo";
import { FileAccessManager } from "@/services/messages/fileAccess";
import { toast } from "@/components/ui/use-toast";

interface AttachmentItemProps {
  attachment: AttachmentProps;
  deliveryId?: string;
  recipientEmail?: string;
}

export function AttachmentItem({ attachment, deliveryId, recipientEmail }: AttachmentItemProps) {
  const {
    isLoading,
    hasError,
    retryCount,
    showDebug,
    accessUrl,
    downloadMethod,
    lastSuccessMethod,
    downloadActive,
    attemptedMethods,
    currentMethodStatus,
    directUrl,
    retryAccess,
    toggleDownloadMethod,
    downloadFile,
    openFile,
    tryDirectAccess,
    toggleDebug
  } = useAttachmentAccess({
    filePath: attachment.path,
    fileName: attachment.name,
    fileType: attachment.type,
    fileSize: attachment.size,
    deliveryId,
    recipientEmail
  });
  
  // Check if there might be bucket-related errors
  const hasBucketError = hasError && !directUrl;
  
  // Function for secure download
  const forceSecureDownload = async () => {
    if (isLoading || !deliveryId || !recipientEmail) {
      console.log("Cannot force secure download - missing parameters or loading");
      return;
    }
    
    try {
      // Force the secure download method regardless of current download method
      console.log("Starting forced secure download");
      const fileAccessManager = new FileAccessManager(attachment.path, deliveryId, recipientEmail);
      const { url } = await fileAccessManager.getAccessUrl('secure', 'download');
      
      if (url) {
        console.log("Secure download URL obtained:", url);
        
        // Parse URL and add additional parameters
        try {
          const parsedUrl = new URL(url);
          
          // Add download parameters using the correct format
          parsedUrl.searchParams.delete('download'); // Remove potential old parameter
          parsedUrl.searchParams.set('download-file', 'true'); // Add new parameter
          parsedUrl.searchParams.set('mode', 'download');
          parsedUrl.searchParams.set('t', Date.now().toString()); // Add cache-busting
          
          const finalUrl = parsedUrl.toString();
          console.log("Final secure download URL:", finalUrl);
          
          FileAccessManager.executeDownload(finalUrl, attachment.name, attachment.type, 'secure');
          
          toast({
            title: "Secure download started",
            description: `${attachment.name} is being downloaded using Edge Function`,
          });
        } catch (urlError) {
          // Fallback to simple string concatenation if URL parsing fails
          const separator = url.includes('?') ? '&' : '?';
          const finalUrl = `${url}${separator}download-file=true&mode=download&t=${Date.now()}`;
          
          console.log("Final secure download URL (fallback method):", finalUrl);
          FileAccessManager.executeDownload(finalUrl, attachment.name, attachment.type, 'secure');
          
          toast({
            title: "Secure download started",
            description: `${attachment.name} is being downloaded using Edge Function`,
          });
        }
      } else {
        console.error("Failed to get secure download URL");
        toast({
          title: "Download failed",
          description: "Could not generate secure download URL",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Secure download error:", error);
      toast({
        title: "Secure download failed",
        description: "An error occurred during secure download",
        variant: "destructive"
      });
    }
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
              <MethodStatusBadge status={currentMethodStatus} />
              <FallbackInfoBadge lastSuccessMethod={lastSuccessMethod} currentMethod={downloadMethod} />
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

          {/* Force secure download button - Only show when delivery params exist */}
          {deliveryId && recipientEmail && (
            <SecureDownloadButton
              isLoading={isLoading}
              onClick={forceSecureDownload}
            />
          )}

          {/* Regular download button */}
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
      
      <AttachmentErrorInfo hasError={hasError} retryCount={retryCount} bucketError={hasBucketError} />

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
