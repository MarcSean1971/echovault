
import React from "react";
import { MessageTypeIcon } from "@/components/message/detail/MessageTypeIcon";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { MessageContent } from "@/components/message/detail/MessageContent";
import { MessageDeliverySettings } from "@/components/message/detail/MessageDeliverySettings";
import { MessageMetadata } from "@/components/message/detail/MessageMetadata";
import { DesktopTimerAlert } from "@/components/message/detail/DesktopTimerAlert";
import { Message } from "@/types/message";

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
            isArmed={isArmed} 
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
  isArmed: boolean;
  formatDate: (dateString: string) => string;
}

function MessageCardHeader({ message, isArmed, formatDate }: MessageCardHeaderProps) {
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
      
      {/* Desktop status badge */}
      <div className="hidden md:block">
        <StatusBadge status={isArmed ? "armed" : "disarmed"}>
          {isArmed ? 'Armed' : 'Disarmed'}
        </StatusBadge>
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
      
      <MessageContent message={message} isArmed={isArmed} />
      <MessageDeliverySettings 
        condition={condition} 
        renderConditionType={renderConditionType}
        formatDate={formatDate}
      />
    </Tabs>
  );
}
