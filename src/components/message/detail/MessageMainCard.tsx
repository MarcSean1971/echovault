
import React from "react";
import { MessageTypeIcon } from "@/components/message/detail/MessageTypeIcon";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageContent } from "@/components/message/detail/MessageContent";
import { MessageDeliverySettings } from "@/components/message/detail/MessageDeliverySettings";
import { MessageMetadata } from "@/components/message/detail/MessageMetadata";
import { DesktopTimerAlert } from "@/components/message/detail/DesktopTimerAlert";
import { Message } from "@/types/message";
import { FileIcon, PaperclipIcon } from "lucide-react";
import { getFileUrl } from "@/services/messages/fileService";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageMainCardProps {
  message: Message;
  isArmed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  deadline: Date | null;
  isMobile: boolean;
  formatDate: (dateString: string) => string;
  renderRecipients: () => React.ReactNode;
  condition: any | null;
  renderConditionType: () => string;
}

export function MessageMainCard({
  message,
  isArmed,
  activeTab,
  setActiveTab,
  deadline,
  isMobile,
  formatDate,
  renderRecipients,
  condition,
  renderConditionType
}: MessageMainCardProps) {
  return (
    <div className="col-span-full lg:col-span-8 lg:order-1">
      <Card className={`${isArmed ? 'border-destructive/30 shadow-md' : ''}`}>
        <div className="p-4 md:p-6 flex flex-col gap-4">
          <MessageCardHeader 
            message={message} 
            formatDate={formatDate} 
          />
          
          {/* Desktop - Timer */}
          {!isMobile && (
            <DesktopTimerAlert deadline={deadline} isArmed={isArmed} />
          )}
          
          {/* Message tabs */}
          <MessageTabs
            message={message}
            isArmed={isArmed}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            condition={condition}
            renderConditionType={renderConditionType}
            formatDate={formatDate}
          />
          
          {/* Mobile - Show metadata toggle */}
          <MessageMetadata 
            message={message} 
            formatDate={formatDate} 
            renderRecipients={renderRecipients} 
          />
        </div>
      </Card>
    </div>
  );
}

interface MessageCardHeaderProps {
  message: Message;
  formatDate: (dateString: string) => string;
}

function MessageCardHeader({ message, formatDate }: MessageCardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MessageTypeIcon messageType={message.message_type} />
          <h1 className="text-xl md:text-2xl font-semibold">{message.title}</h1>
        </div>
        
        {/* Desktop - Last updated */}
        <p className="text-xs text-muted-foreground hidden md:block">
          {message.updated_at !== message.created_at ? 
            `Last updated: ${formatDate(message.updated_at)}` : 
            `Created: ${formatDate(message.created_at)}`}
        </p>
      </div>
    </div>
  );
}

interface MessageTabsProps {
  message: Message;
  isArmed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  condition: any | null;
  renderConditionType: () => string;
  formatDate: (dateString: string) => string;
}

function MessageTabs({
  message,
  isArmed,
  activeTab,
  setActiveTab,
  condition,
  renderConditionType,
  formatDate
}: MessageTabsProps) {
  return (
    <Tabs defaultValue="content" value={activeTab} className="w-full" onValueChange={setActiveTab}>
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="content">Message</TabsTrigger>
        <TabsTrigger value="settings">Delivery</TabsTrigger>
      </TabsList>
      
      <TabsContent value="content">
        <MessageContent message={message} isArmed={isArmed} />
        
        {/* Attachments Section */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <PaperclipIcon className="h-4 w-4" />
              Attachments ({message.attachments.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.attachments.map((attachment, index) => (
                <AttachmentItem key={index} attachment={attachment} />
              ))}
            </div>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="settings">
        <MessageDeliverySettings 
          condition={condition} 
          renderConditionType={renderConditionType}
          formatDate={formatDate}
        />
      </TabsContent>
    </Tabs>
  );
}

interface AttachmentItemProps {
  attachment: {
    name: string;
    size: number;
    type: string;
    path: string;
  };
}

function AttachmentItem({ attachment }: AttachmentItemProps) {
  const downloadFile = async () => {
    try {
      const url = await getFileUrl(attachment.path);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error opening attachment:", error);
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
