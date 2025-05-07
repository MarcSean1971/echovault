
import React from "react";
import { Message } from "@/types/message";
import { MessageHeader } from "../MessageHeader";
import { MessageContent } from "../MessageContent";
import { MessageMainCard } from "../MessageMainCard";

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
  recipientEmail
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
        <MessageContent 
          message={message}
          // Fix: Remove deliveryId and recipientEmail as they don't exist in MessageContentProps
        />
      </MessageMainCard>
    </>
  );
}
