
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
import { useMessageDeliveryStatus } from "@/hooks/useMessageDeliveryStatus";
import { triggerDeadmanSwitch } from "@/services/messages/whatsApp";

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

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
    lastCheckIn,
    refreshCount
  } = useMessageDetail(id, handleError);
  
  // Get message delivery status
  const { isDelivered, lastDelivered, viewCount, isLoading: isLoadingDelivery } = useMessageDeliveryStatus(id || '');
  
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

  // Listen for condition updates to refresh data
  useEffect(() => {
    const handleConditionUpdated = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    
    // Add listener for deadline reached event
    const handleDeadlineReached = (event: Event) => {
      if (!id || !isArmed || !condition || condition.condition_type !== 'no_check_in') return;
      
      // If this is a deadman's switch and the deadline has been reached,
      // attempt to automatically trigger the message delivery
      console.log('[MessageDetail] Deadline reached event received, attempting to trigger message delivery');
      
      // Attempt automatic delivery
      triggerDeadmanSwitch(id).catch(error => {
        console.error('[MessageDetail] Failed to auto-trigger deadman switch on deadline reached:', error);
      });
    };
    
    window.addEventListener('deadline-reached', handleDeadlineReached);
    
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
      window.removeEventListener('deadline-reached', handleDeadlineReached);
    };
  }, [id, isArmed, condition]);

  // Update the local refreshTrigger whenever refreshCount changes from the hook
  useEffect(() => {
    if (refreshCount > 0) {
      console.log(`[MessageDetail] refreshCount changed to ${refreshCount}, updating refreshTrigger`);
      setRefreshTrigger(refreshCount);
    }
  }, [refreshCount]);

  if (isLoading) {
    return <MessageLoading />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
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
      lastDelivered={lastDelivered}
      isDelivered={isDelivered}
      viewCount={viewCount}
      isLoadingDelivery={isLoadingDelivery}
      refreshTrigger={refreshTrigger}
    />
  );
}
