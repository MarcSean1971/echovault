
import React from "react";
import { FileIcon, Shield, Eye } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { formatFileSize } from "@/utils/fileUtils";
import { Button } from "@/components/ui/button";
import { useAttachmentAccess } from "@/hooks/useAttachmentAccess";
import { FileAttachment } from "@/components/FileUploader";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";

interface FormAttachmentItemProps {
  attachment: FileAttachment;
}

export function FormAttachmentItem({ attachment }: FormAttachmentItemProps) {
  const {
    isLoading,
    hasError,
    openFile,
  } = useAttachmentAccess({
    filePath: attachment.path,
    fileName: attachment.name,
    fileType: attachment.type,
    fileSize: attachment.size,
  });
  
  // Get icon based on file type
  const getFileIcon = () => {
    if (attachment.isUploaded) {
      return <Shield className={`h-4 w-4 text-blue-600 flex-shrink-0 ${HOVER_TRANSITION}`} />;
    }
    
    return <FileIcon className={`h-4 w-4 flex-shrink-0 ${HOVER_TRANSITION}`} />;
  };
  
  const handleViewFile = async () => {
    if (!attachment.path) {
      toast({
        title: "Cannot preview file",
        description: "This file hasn't been uploaded yet",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await openFile();
    } catch (error) {
      console.error("Error opening file:", error);
      toast({
        title: "Error",
        description: "Failed to open the file",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="border rounded-md p-3 transition-all duration-200 hover:shadow-sm hover:border-blue-200 hover:bg-blue-50/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          {getFileIcon()}
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="block truncate font-medium">{attachment.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleViewFile}
            disabled={isLoading || !attachment.path}
            className={`${HOVER_TRANSITION} hover:bg-blue-100 hover:text-blue-700`}
          >
            {isLoading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
