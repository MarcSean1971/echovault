
import React from "react";
import { Message } from "@/types/message";
import { MessageLoading } from "./MessageLoading";
import { MessageNotFound } from "./MessageNotFound";
import { SendTestMessageDialog } from "./SendTestMessageDialog";
import { useSearchParams } from "react-router-dom";
import { MessageHeaderCard } from "./sections/MessageHeaderCard";
import { MessageContentSection } from "./sections/MessageContentSection";
import { TriggerSettingsSection } from "./sections/TriggerSettingsSection";
import { RecipientsListSection } from "./sections/RecipientsListSection";
import { MessageActionButtons } from "./sections/MessageActionButtons";

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
  lastCheckIn?: string | null;
  checkInCode?: string | null;
  lastDelivered?: string | null;
  isDelivered?: boolean;
  viewCount?: number | null;
  isLoadingDelivery?: boolean;
  refreshTrigger?: number;
  backButton: React.ReactNode; // Back button prop
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
  checkInCode,
  lastDelivered,
  isDelivered,
  viewCount,
  isLoadingDelivery,
  refreshTrigger,
  backButton
}: MessageDetailContentProps) {
  // Get delivery ID and recipient email from URL for attachment access
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');

  // Full loading state is only displayed if we have no message at all
  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button at the left side, matching Edit page placement */}
      {backButton}
      
      <div className="max-w-3xl mx-auto">
        <div className="space-y-4"> {/* Space between main content sections */}
          {/* Combined Header and Content with no space between them */}
          <div className="space-y-0"> {/* No space between these two specific components */}
            <MessageHeaderCard 
              message={message}
              isArmed={isArmed}
              isActionLoading={isActionLoading}
              handleDisarmMessage={handleDisarmMessage}
              handleArmMessage={handleArmMessage}
            />
            
            {/* SECTION 1: Message Content - now directly attached to header with no gap */}
            <MessageContentSection 
              message={message} 
              isLoading={isLoading}
              deliveryId={deliveryId}
              recipientEmail={recipientEmail}
            />
          </div>
          
          {/* SECTION 2: Trigger Settings */}
          <TriggerSettingsSection 
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
          
          {/* SECTION 3: Recipients */}
          <RecipientsListSection 
            recipients={recipients}
            isArmed={isArmed}
            isActionLoading={isActionLoading}
            onSendTestMessage={onSendTestMessage}
          />
          
          {/* Actions Card */}
          <MessageActionButtons 
            messageId={message.id}
            isArmed={isArmed}
            isActionLoading={isActionLoading}
            handleDelete={handleDelete}
          />
        </div>
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
