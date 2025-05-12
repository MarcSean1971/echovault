
import React, { useState } from "react";
import { Message } from "@/types/message";
import { MessageLoading } from "./MessageLoading";
import { MessageNotFound } from "./MessageNotFound";
import { SendTestMessageDialog } from "./SendTestMessageDialog";
import { useSearchParams } from "react-router-dom";
import { MainContentSection } from "./content/MainContentSection";
import { StatusDeliverySection } from "./content/StatusDeliverySection";
import { RecipientsSection } from "./content/RecipientsSection";
import { MessageActionFooter } from "./MessageActionFooter";

interface MessageDetailContentProps {
  message: Message;
  isLoading: boolean;
  isArmed: boolean;
  isActionLoading: boolean;
  deadline: Date | null;
  conditionId: string | null;
  condition: any;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<Date | null>;
  handleDelete: () => Promise<void>;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  renderRecipients: () => React.ReactNode;
  recipients: any[];
  onSendTestMessage: () => void;
  showSendTestDialog: boolean;
  setShowSendTestDialog: (show: boolean) => void;
  handleSendTestMessages: (selectedRecipients: { id: string; name: string; email: string }[]) => Promise<void>;
  lastCheckIn?: string | null; // Added prop for last check-in time
  checkInCode?: string | null; // Added prop for check-in code
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
  handleSendTestMessages,
  lastCheckIn,
  checkInCode
}: MessageDetailContentProps) {
  // Add state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Get delivery ID and recipient email from URL for attachment access
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');

  if (isLoading) {
    return <MessageLoading />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 pb-20 mb-16">
      <div className="space-y-6">
        {/* Message Content */}
        <MainContentSection 
          message={message}
          isArmed={isArmed}
          isActionLoading={isActionLoading}
          condition={condition}
          formatDate={formatDate}
          renderConditionType={renderConditionType}
          handleDisarmMessage={handleDisarmMessage}
          handleArmMessage={handleArmMessage}
          deliveryId={deliveryId}
          recipientEmail={recipientEmail}
        />
        
        {/* Status and Delivery Settings - Now with check-in information */}
        <StatusDeliverySection
          condition={condition}
          isArmed={isArmed}
          formatDate={formatDate}
          renderConditionType={renderConditionType}
          message={message}
          deadline={deadline}
          lastCheckIn={lastCheckIn}
          checkInCode={checkInCode}
        />
        
        {/* Recipients Section */}
        <RecipientsSection
          recipients={recipients}
          isArmed={isArmed}
          isActionLoading={isActionLoading}
          onSendTestMessage={onSendTestMessage}
        />
        
        {/* Action Footer */}
        <MessageActionFooter
          messageId={message.id}
          isArmed={isArmed}
          isActionLoading={isActionLoading}
          handleArmMessage={handleArmMessage}
          handleDisarmMessage={handleDisarmMessage}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          handleDelete={handleDelete}
          onSendTestMessage={onSendTestMessage}
        />
      </div>
      
      <SendTestMessageDialog 
        open={showSendTestDialog}
        onOpenChange={setShowSendTestDialog}
        messageTitle={message.title}
        recipients={recipients}
        onSendTestMessages={handleSendTestMessages}
      />
    </div>
  );
}
