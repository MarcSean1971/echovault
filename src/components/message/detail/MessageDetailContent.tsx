import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Message } from "@/types/message";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageHeader } from "@/components/message/detail/MessageHeader";
import { MessageMainCard } from "@/components/message/detail/MessageMainCard";
import { MessageActionFooter } from "@/components/message/detail/MessageActionFooter";
import { MessageSidebar } from "@/components/message/detail/MessageSidebar";
import { MobileTimerAlert } from "@/components/message/detail/MobileTimerAlert";
import { MessageDetailsSheet } from "@/components/message/detail/MessageDetailsSheet";

interface MessageDetailContentProps {
  message: Message;
  isLoading: boolean;
  isArmed: boolean;
  isActionLoading: boolean;
  deadline: Date | null;
  conditionId: string | null;
  condition: any | null;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<void>;
  handleDelete: () => Promise<void>;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  renderRecipients: () => React.ReactNode;
  recipients?: any[];
  onSendTestMessage?: () => void;
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
  recipients = [],
  onSendTestMessage
}: MessageDetailContentProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("content");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);

  return (
    <div className="container max-w-5xl mx-auto px-4 py-4 md:py-8 space-y-4">
      {/* Header with back button and status */}
      <MessageHeader 
        message={message} 
        isArmed={isArmed} 
        isActionLoading={isActionLoading}
        handleDisarmMessage={handleDisarmMessage}
        handleArmMessage={handleArmMessage}
      />
      
      {/* Main content with responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* Mobile countdown timer - only shown when armed */}
        {isMobile && (
          <MobileTimerAlert deadline={deadline} isArmed={isArmed} />
        )}
        
        {/* Main message card */}
        <MessageMainCard
          message={message}
          isArmed={isArmed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          deadline={deadline}
          isMobile={isMobile}
          formatDate={formatDate}
          renderRecipients={renderRecipients}
          condition={condition}
          renderConditionType={renderConditionType}
        />
        
        {/* Sidebar - Desktop only */}
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
        />
      </div>
      
      {/* Mobile bottom action sheet and delete confirmation */}
      {isMobile && (
        <MessageActionFooter 
          messageId={message.id}
          isArmed={isArmed}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          setShowDetailsSheet={setShowDetailsSheet}
          handleDelete={handleDelete}
        />
      )}
      
      {/* Mobile details sheet */}
      {isMobile && (
        <MessageDetailsSheet 
          showDetailsSheet={showDetailsSheet}
          setShowDetailsSheet={setShowDetailsSheet}
          formatDate={formatDate}
          message={message}
          renderRecipients={renderRecipients}
          renderConditionType={renderConditionType}
          isArmed={isArmed}
          conditionId={conditionId}
          isActionLoading={isActionLoading}
          handleDisarmMessage={handleDisarmMessage}
          handleArmMessage={handleArmMessage}
          recipients={recipients}
          onSendTestMessage={onSendTestMessage}
        />
      )}
      
      {/* Add spacing at bottom on mobile to account for fixed action bar */}
      {isMobile && <div className="h-16"></div>}
    </div>
  );
}
