
import React from "react";
import { Message } from "@/types/message";
import { MessageHeader } from "../MessageHeader";
import { MessageContent } from "../MessageContent";
import { MessageMainCard } from "../MessageMainCard";
import { StatusDeliverySection } from "./StatusDeliverySection";
import { RecipientsSection } from "./RecipientsSection";
import { Separator } from "@/components/ui/separator";

interface MainContentSectionProps {
  message: Message;
  isArmed: boolean;
  isActionLoading: boolean;
  condition: any;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<Date | null>;
  deliveryId: string | null;
  recipientEmail: string | null;
  recipients?: any[];
  onSendTestMessage?: () => void;
  lastCheckIn?: string | null;
  checkInCode?: string | null;
  lastDelivered?: string | null;
  isDelivered?: boolean;
  viewCount?: number | null;
  isLoadingDelivery?: boolean;
  refreshTrigger?: number;
  deadline?: Date | null;
}

export function MainContentSection({
  message,
  isArmed,
  isActionLoading,
  condition,
  formatDate,
  renderConditionType,
  handleDisarmMessage,
  handleArmMessage,
  deliveryId,
  recipientEmail,
  recipients = [],
  onSendTestMessage,
  lastCheckIn,
  checkInCode,
  lastDelivered,
  isDelivered,
  viewCount,
  isLoadingDelivery,
  refreshTrigger,
  deadline
}: MainContentSectionProps) {
  return (
    <>
      <MessageHeader
        message={message}
        isArmed={isArmed}
        isActionLoading={isActionLoading}
        handleDisarmMessage={handleDisarmMessage}
        handleArmMessage={handleArmMessage}
      />
      
      <MessageMainCard>
        {/* Message Content - Text, Video, Attachments, Location, Etc */}
        <MessageContent 
          message={message}
          deliveryId={deliveryId}
          recipientEmail={recipientEmail}
          conditionType={condition?.condition_type}
        />
        
        {/* Message Information Sections */}
        <Separator className="my-6" />
        
        {/* Status and Delivery Settings */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-3">Message Settings</h3>
          <StatusDeliverySection 
            message={message}
            condition={condition}
            formatDate={formatDate}
            renderConditionType={renderConditionType}
            isArmed={isArmed}
            refreshTrigger={refreshTrigger}
            deadline={deadline}
            lastCheckIn={lastCheckIn}
            checkInCode={checkInCode}
            lastDelivered={lastDelivered}
            isDelivered={isDelivered}
            viewCount={viewCount}
            isLoadingDelivery={isLoadingDelivery}
          />
        </div>
        
        {/* Recipients Section */}
        {recipients && recipients.length > 0 && (
          <div className="mt-8">
            <RecipientsSection
              recipients={recipients}
              isArmed={isArmed}
              isActionLoading={isActionLoading}
              onSendTestMessage={onSendTestMessage || (() => {})}
            />
          </div>
        )}
      </MessageMainCard>
    </>
  );
}
