
import React from "react";
import { FileIcon, AlertCircle, FileCheck, Shield, ExternalLink } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AttachmentProps } from "./types";
import { formatFileSize } from "@/utils/fileUtils";
import { AttachmentBadge } from "./AttachmentBadge";
import { 
  DownloadButton,
  OpenButton,
  MethodToggleButton
} from "./buttons";
import { useAttachmentAccess } from "@/hooks/useAttachmentAccess";
import { MethodStatusBadge } from "./StatusBadges";
import { AttachmentErrorInfo } from "./AttachmentErrorInfo";
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
    accessUrl,
    downloadMethod,
    downloadActive,
    currentMethodStatus,
    downloadFile,
    openFile,
    toggleDownloadMethod,
    tryDirectAccess
  } = useAttachmentAccess({
    filePath: attachment.path,
    fileName: attachment.name,
    fileType: attachment.type,
    fileSize: attachment.size,
    deliveryId,
    recipientEmail
  });
  
  // Get icon based on file type
  const getFileIcon = () => {
    if (hasError) {
      return <AlertCircle className={`h-4 w-4 text-red-500 flex-shrink-0 ${HOVER_TRANSITION}`} />;
    }
    
    if (downloadMethod === 'secure') {
      return <Shield className={`h-4 w-4 text-blue-600 flex-shrink-0 ${HOVER_TRANSITION}`} />;
    }
    
    if (downloadMethod === 'signed') {
      return <FileCheck className={`h-4 w-4 text-green-600 flex-shrink-0 ${HOVER_TRANSITION}`} />;
    }
    
    if (downloadMethod === 'direct') {
      return <ExternalLink className={`h-4 w-4 text-amber-600 flex-shrink-0 ${HOVER_TRANSITION}`} />;
    }
    
    return <FileIcon className={`h-4 w-4 flex-shrink-0 ${HOVER_TRANSITION}`} />;
  };
  
  // Handle direct access click with async function
  const handleDirectAccess = async () => {
    if (tryDirectAccess) {
      await tryDirectAccess();
    }
  };
  
  return (
    <div className={`border rounded-md p-3 transition-all duration-200 hover:shadow-sm ${HOVER_TRANSITION} ${
      hasError ? 'border-red-300 bg-red-50' : 
      downloadActive ? 'border-blue-200 bg-blue-50' : 
      'hover:border-blue-200 hover:bg-blue-50/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          {getFileIcon()}
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className={`block truncate font-medium ${HOVER_TRANSITION}`}>{attachment.name}</span>
            </div>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <AttachmentBadge method={downloadMethod} />
              <MethodStatusBadge status={currentMethodStatus} />
              <span className={`text-xs text-muted-foreground ${HOVER_TRANSITION}`}>{formatFileSize(attachment.size)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {/* Download Method Toggle */}
          <MethodToggleButton
            downloadMethod={downloadMethod}
            isLoading={isLoading}
            toggleDownloadMethod={toggleDownloadMethod}
          />
          
          {/* Download button */}
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
      
      <AttachmentErrorInfo hasError={hasError} retryCount={retryCount} bucketError={false} />
    </div>
  );
}
