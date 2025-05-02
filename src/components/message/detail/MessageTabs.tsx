
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Message } from "@/types/message";
import { MessageContent } from "@/components/message/detail/MessageContent";
import { MessageDeliverySettings } from "@/components/message/detail/MessageDeliverySettings";
import { MessageAttachments } from "@/components/message/detail/MessageAttachments";

interface MessageTabsProps {
  message: Message;
  isArmed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  condition: any | null;
  renderConditionType: () => string;
  formatDate: (dateString: string) => string;
}

export function MessageTabs({
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
        <MessageAttachments message={message} />
      </TabsContent>
      
      <TabsContent value="settings">
        <MessageDeliverySettings 
          condition={condition} 
          renderConditionType={renderConditionType}
          formatDate={formatDate}
          showInTabs={true}
        />
      </TabsContent>
    </Tabs>
  );
}
