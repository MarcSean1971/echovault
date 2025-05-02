
import React from "react";
import { Card } from "@/components/ui/card";
import { Message } from "@/types/message";
import { DesktopTimerAlert } from "@/components/message/detail/DesktopTimerAlert";
import { MessageCardHeader } from "@/components/message/detail/MessageCardHeader";
import { MessageTabs } from "@/components/message/detail/MessageTabs";
import { MessageMetadata } from "@/components/message/detail/MessageMetadata";

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
