
import { useState } from "react";
import { StatusCard } from "./sidebar/StatusCard";
import { RecipientsCard } from "./sidebar/RecipientsCard";
import { ActionsCard } from "./sidebar/ActionsCard";
import { Message } from "@/types/message";
import { sendTestNotification } from "@/services/messages/notificationService";

interface MessageSidebarProps {
  message: Message;
  isArmed: boolean;
  conditionId: string | null;
  isActionLoading: boolean;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  renderRecipients: () => React.ReactNode;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<Date | null>;  // Fix the return type
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (value: boolean) => void;
  handleDelete: () => Promise<void>;
  recipients?: any[];
  onSendTestMessage?: () => void;
  condition?: any;
}

export function MessageSidebar({
  message,
  isArmed,
  conditionId,
  isActionLoading,
  formatDate,
  renderConditionType,
  renderRecipients,
  handleDisarmMessage,
  handleArmMessage,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete,
  recipients = [],
  onSendTestMessage,
  condition
}: MessageSidebarProps) {
  // Get the condition type
  const conditionType = condition?.condition_type;
  
  // Handle sending a test message
  const handleSendTest = async () => {
    if (onSendTestMessage) {
      onSendTestMessage();
    } else {
      await sendTestNotification(message.id);
    }
  };
  
  return (
    <div className="lg:col-span-1 order-1 lg:order-2">
      <StatusCard 
        isArmed={isArmed}
        conditionType={renderConditionType()}
        createdAt={formatDate(message.created_at)}
        isActionLoading={isActionLoading}
        message={message}
        formatDate={formatDate}
      />
      
      {recipients && recipients.length > 0 && (
        <RecipientsCard 
          recipients={recipients}
          renderRecipients={renderRecipients}
          isArmed={isArmed}
          isActionLoading={isActionLoading}
          onSendTestMessage={handleSendTest}
        />
      )}
      
      <ActionsCard 
        messageId={message.id}
        isArmed={isArmed}
        conditionId={conditionId}
        isActionLoading={isActionLoading}
        handleArmMessage={handleArmMessage}
        handleDisarmMessage={handleDisarmMessage}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        handleDelete={handleDelete}
        onSendTestMessage={handleSendTest}
        conditionType={conditionType}
      />
    </div>
  );
}
