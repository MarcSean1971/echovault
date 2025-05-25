
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
    <div className={`border rounded-md p-3 md:p-4 transition-all duration-200 hover:shadow-sm ${HOVER_TRANSITION} ${
      hasError ? 'border-red-300 bg-red-50' : 
      downloadActive ? 'border-blue-200 bg-blue-50' : 
      'hover:border-blue-200 hover:bg-blue-50/30'
    }`}>
      {/* Mobile-first: Stack vertically, then horizontal on md+ screens */}
      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
        {/* File info section */}
        <div className="flex items-start space-x-3 overflow-hidden min-w-0 flex-1">
          <div className="mt-0.5 flex-shrink-0">
            {getFileIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`block truncate font-medium text-sm md:text-base ${HOVER_TRANSITION}`}>
                {attachment.name}
              </span>
            </div>
            {/* Mobile: Stack badges and file size vertically for better readability */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-2 sm:space-y-0">
              <div className="flex items-center gap-2 flex-wrap">
                <AttachmentBadge method={downloadMethod} />
                <MethodStatusBadge status={currentMethodStatus} />
              </div>
              <span className={`text-xs text-muted-foreground ${HOVER_TRANSITION}`}>
                {formatFileSize(attachment.size)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Action buttons section - mobile: full width with proper spacing, desktop: compact */}
        <div className="flex space-x-2 md:space-x-2 justify-start md:justify-end flex-shrink-0 mt-1 md:mt-0">
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
