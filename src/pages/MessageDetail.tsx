
import { useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageLoading } from "@/components/message/detail/MessageLoading";
import { MessageNotFound } from "@/components/message/detail/MessageNotFound";
import { MessageDetailContent } from "@/components/message/detail/MessageDetailContent";
import { formatDate, getConditionType } from "@/utils/messageHelpers";
import { useMessageDetail } from "@/hooks/useMessageDetail";
import { MessageRecipientProvider } from "@/components/message/detail/MessageRecipientProvider";
import { useMessageActions } from "@/hooks/useMessageActions";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ReminderHistory } from "@/components/message/detail/content/deadman/ReminderHistory";

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [showReminderHistory, setShowReminderHistory] = useState(false);

  // Use memoized callback for error navigation to prevent recreation on each render
  const handleError = useCallback(() => navigate("/messages"), [navigate]);

  // Use our custom hook to fetch the message data
  const { 
    message, 
    isLoading, 
    isArmed, 
    deadline, 
    conditionId, 
    condition, 
    recipients,
    setIsArmed,
    lastCheckIn
  } = useMessageDetail(id, handleError);
  
  // Use our custom hook for message actions
  const {
    isActionLoading,
    showSendTestDialog,
    setShowSendTestDialog,
    handleMessageDelete,
    onArmMessage,
    onDisarmMessage,
    onSendTestMessage,
    handleSendTestMessages
  } = useMessageActions(id, conditionId, setIsArmed);
  
  // Get the recipient rendering function
  const { renderRecipients } = MessageRecipientProvider({ recipients });

  // Function to handle viewing reminder history
  const handleViewReminderHistory = () => {
    setShowReminderHistory(true);
  };

  // Listen for condition updates to refresh data
  useEffect(() => {
    const handleConditionUpdated = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
    };
  }, []);

  if (isLoading) {
    return <MessageLoading />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <>
      <MessageDetailContent
        message={message}
        isLoading={isLoading}
        isArmed={isArmed}
        isActionLoading={isActionLoading}
        deadline={deadline}
        conditionId={conditionId}
        condition={condition}
        handleDisarmMessage={onDisarmMessage}
        handleArmMessage={onArmMessage}
        handleDelete={handleMessageDelete}
        formatDate={formatDate}
        renderConditionType={() => getConditionType(condition)}
        renderRecipients={renderRecipients}
        recipients={recipients}
        onSendTestMessage={onSendTestMessage}
        showSendTestDialog={showSendTestDialog}
        setShowSendTestDialog={setShowSendTestDialog}
        handleSendTestMessages={handleSendTestMessages}
        lastCheckIn={condition?.last_checked || null}
        checkInCode={condition?.check_in_code || null}
      />
      
      {/* Reminder History Sheet */}
      <Sheet open={showReminderHistory} onOpenChange={setShowReminderHistory}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Reminder History</SheetTitle>
            <SheetDescription>
              History of reminder notifications sent for this message
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ReminderHistory messageId={message?.id || ''} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
