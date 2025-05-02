
import { useState } from "react";
import { Message } from "@/types/message";
import { SendTestMessageDialog } from "./SendTestMessageDialog";
import { StatusCard } from "./sidebar/StatusCard";
import { RecipientsCard } from "./sidebar/RecipientsCard";
import { ActionsCard } from "./sidebar/ActionsCard";

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
  setShowDeleteConfirm: (show: boolean) => void;
  handleDelete: () => Promise<void>;
  recipients?: { id: string; name: string; email: string }[];
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
  onSendTestMessage = () => {}
}: MessageSidebarProps) {
  const [showTestMessageDialog, setShowTestMessageDialog] = useState(false);

  const handleSendTestMessage = () => {
    if (onSendTestMessage) {
      onSendTestMessage();
    } else {
      setShowTestMessageDialog(true);
    }
  };

  return (
    <div className="col-span-full lg:col-span-4 lg:order-2 space-y-4">
      {/* Status Card */}
      <StatusCard 
        isArmed={isArmed}
        message={message}
        conditionId={conditionId}
        isActionLoading={isActionLoading}
        formatDate={formatDate}
        renderConditionType={renderConditionType}
        handleDisarmMessage={handleDisarmMessage}
        handleArmMessage={handleArmMessage}
      />
      
      {/* Recipients Card */}
      <RecipientsCard 
        recipients={recipients}
        renderRecipients={renderRecipients}
        isArmed={isArmed}
        isActionLoading={isActionLoading}
        onSendTestMessage={handleSendTestMessage}
      />
      
      {/* Actions Card */}
      <ActionsCard 
        messageId={message.id}
        isArmed={isArmed}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        handleDelete={handleDelete}
      />
      
      {/* Test Message Dialog */}
      <SendTestMessageDialog
        open={showTestMessageDialog}
        onOpenChange={setShowTestMessageDialog}
        messageTitle={message.title}
        recipients={recipients}
      />
    </div>
  );
}
