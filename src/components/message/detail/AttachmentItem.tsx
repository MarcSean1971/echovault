
import React, { useState } from "react";
import { FileIcon, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { getPublicFileUrl, getAuthenticatedFileUrl } from "@/services/messages/fileAccessService";

interface AttachmentItemProps {
  attachment: {
    name: string;
    size: number;
    type: string;
    path: string;
  };
  deliveryId?: string;
  recipientEmail?: string;
}

export function AttachmentItem({ attachment, deliveryId, recipientEmail }: AttachmentItemProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getFileAccessUrl = async () => {
    try {
      console.log("Getting file access URL for:", attachment.path);
      console.log("Public access mode:", !!deliveryId && !!recipientEmail);
      
      // If we're in public view mode with delivery ID and recipient email 
      if (deliveryId && recipientEmail) {
        console.log(`Using public access with deliveryId: ${deliveryId}, recipient: ${recipientEmail}`);
        const url = await getPublicFileUrl(attachment.path, deliveryId, recipientEmail);
        console.log("Generated public URL:", url);
        return url;
      } else {
        // Default to the standard Supabase storage URL generation for authenticated users
        console.log("Using authenticated access");
        const url = await getAuthenticatedFileUrl(attachment.path);
        console.log("Generated authenticated URL:", url);
        return url;
      }
    } catch (error) {
      console.error("Error generating URL:", error);
      return null;
    }
  };

  const downloadFile = async () => {
    try {
      setIsLoading(true);
      const url = await getFileAccessUrl();
      
      if (url) {
        // Create an invisible anchor element and trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.name;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast({
          title: "Download started",
          description: `${attachment.name} is being downloaded`,
        });
      } else {
        toast({
          title: "Error",
          description: "Could not access the file. Please try again or contact support if the issue persists.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast({
        title: "Error",
        description: "An error occurred while trying to access the attachment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openFile = async () => {
    try {
      setIsLoading(true);
      const url = await getFileAccessUrl();
      
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Could not access the file. Please try again or contact support if the issue persists.",
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
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };
  
  return (
    <div className="border rounded-md p-3 hover:border-primary/20 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <FileIcon className="h-4 w-4 flex-shrink-0" />
          <div className="truncate">
            <span className="block truncate">{attachment.name}</span>
            <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadFile}
                  disabled={isLoading}
                  className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={openFile}
                  disabled={isLoading}
                  className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open in new tab</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
