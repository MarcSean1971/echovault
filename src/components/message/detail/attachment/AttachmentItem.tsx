
import React from "react";
import { FileIcon, AlertCircle } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AttachmentProps } from "./types";
import { formatFileSize } from "@/utils/fileUtils";
import { AttachmentBadge } from "./AttachmentBadge";
import { 
  DownloadButton,
  OpenButton
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
    openFile
  } = useAttachmentAccess({
    filePath: attachment.path,
    fileName: attachment.name,
    fileType: attachment.type,
    fileSize: attachment.size,
    deliveryId,
    recipientEmail
  });
  
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
              <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
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
      
      <AttachmentErrorInfo hasError={hasError} retryCount={retryCount} bucketError={false} />
    </div>
  );
}
