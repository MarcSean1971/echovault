
import React from "react";
import { FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getFileUrl } from "@/services/messages/fileService";
import { toast } from "@/components/ui/use-toast";

interface AttachmentItemProps {
  attachment: {
    name: string;
    size: number;
    type: string;
    path: string;
  };
}

export function AttachmentItem({ attachment }: AttachmentItemProps) {
  const downloadFile = async () => {
    try {
      const url = await getFileUrl(attachment.path);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Could not access the file. It may have been deleted or you don't have permission to view it.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error opening attachment:", error);
      toast({
        title: "Error",
        description: "An error occurred while trying to access the attachment",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center justify-start w-full text-left p-2 h-auto" 
            onClick={downloadFile}
          >
            <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <div className="truncate">
              <span className="block truncate">{attachment.name}</span>
              <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to download</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
