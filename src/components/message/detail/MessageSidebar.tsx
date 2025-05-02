
import { StatusCard } from "./sidebar/StatusCard";
import { RecipientsCard } from "./sidebar/RecipientsCard";
import { ActionsCard } from "./sidebar/ActionsCard";
import { ReminderHistoryDialog } from "./ReminderHistoryDialog";
import { useState } from "react";
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
  handleArmMessage: () => Promise<void>;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (value: boolean) => void;
  handleDelete: () => Promise<void>;
  recipients?: any[];
  onSendTestMessage?: () => void;
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
  onSendTestMessage
}: MessageSidebarProps) {
  const [reminderHistoryOpen, setReminderHistoryOpen] = useState(false);
  
  // Handle sending a test message
  const handleSendTest = async () => {
    if (onSendTestMessage) {
      onSendTestMessage();
    } else {
      await sendTestNotification(message.id);
    }
  };
  
  return (
    <div className="lg:col-span-4 lg:order-0 hidden lg:block">
      <StatusCard 
        isArmed={isArmed}
        conditionType={renderConditionType()}
        createdAt={formatDate(message.created_at)}
        isActionLoading={isActionLoading}
        message={message}
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
        onViewReminderHistory={() => setReminderHistoryOpen(true)}
      />
      
      {/* Reminder History Dialog */}
      {conditionId && (
        <ReminderHistoryDialog 
          open={reminderHistoryOpen} 
          onOpenChange={setReminderHistoryOpen} 
          messageId={message.id}
        />
      )}
    </div>
  );
}
