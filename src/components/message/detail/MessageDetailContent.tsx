
import React, { useState } from "react";
import { MessageLoading } from "./MessageLoading";
import { MessageNotFound } from "./MessageNotFound";
import { MessageSidebar } from "./MessageSidebar";
import { MainContentSection } from "./content/MainContentSection";
import { SendTestMessageDialog } from "./SendTestMessageDialog";
import { Message } from "@/types/message";

interface MessageDetailContentProps {
  message: Message;
  isLoading: boolean;
  isArmed: boolean;
  isActionLoading: boolean;
  deadline: Date | null;
  conditionId: string | null;
  condition: any;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<void>;
  handleDelete: () => Promise<void>;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  renderRecipients: () => React.ReactNode;
  recipients: any[];
  onSendTestMessage: () => void;
  showSendTestDialog: boolean;
  setShowSendTestDialog: (show: boolean) => void;
  handleSendTestMessages: (selectedRecipients: { id: string; name: string; email: string }[]) => Promise<void>;
}

export function MessageDetailContent({
  message,
  isLoading,
  isArmed,
  isActionLoading,
  deadline,
  conditionId,
  condition,
  handleDisarmMessage,
  handleArmMessage,
  handleDelete,
  formatDate,
  renderConditionType,
  renderRecipients,
  recipients,
  onSendTestMessage,
  showSendTestDialog,
  setShowSendTestDialog,
  handleSendTestMessages
}: MessageDetailContentProps) {
  // Add state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  if (isLoading) {
    return <MessageLoading />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Using flex layout with adjusted percentages */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content area - 51.66% width on large screens */}
        <div className="w-full lg:w-[51.66%] order-2 lg:order-1">
          <MainContentSection
            message={message}
            isArmed={isArmed}
            isActionLoading={isActionLoading}
            condition={condition}
            formatDate={formatDate}
            renderConditionType={renderConditionType}
            handleDisarmMessage={handleDisarmMessage}
            handleArmMessage={handleArmMessage}
          />
        </div>
        
        {/* Sidebar - 48.33% width on large screens */}
        <div className="w-full lg:w-[48.33%] order-1 lg:order-2">
          <MessageSidebar 
            message={message}
            isArmed={isArmed}
            conditionId={conditionId}
            isActionLoading={isActionLoading}
            formatDate={formatDate}
            renderConditionType={renderConditionType}
            renderRecipients={renderRecipients}
            handleDisarmMessage={handleDisarmMessage}
            handleArmMessage={handleArmMessage}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            handleDelete={handleDelete}
            recipients={recipients}
            onSendTestMessage={onSendTestMessage}
            condition={condition}
          />
        </div>
      </div>
      
      <SendTestMessageDialog 
        open={showSendTestDialog}
        onOpenChange={setShowSendTestDialog}
        messageTitle={message.title}
        recipients={recipients}
      />
    </div>
  );
}
