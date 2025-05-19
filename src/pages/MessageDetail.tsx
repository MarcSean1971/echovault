
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
import { toast } from "@/components/ui/use-toast";

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isRendered, setIsRendered] = useState(false);
  
  // Use memoized callback for error navigation
  const handleError = useCallback(() => {
    toast({
      title: "Error",
      description: "Could not load message details",
      variant: "destructive"
    });
    navigate("/messages");
  }, [navigate]);
  
  // Get minimal message data first for immediate display
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
  
  // Get message delivery status - loads independently
  const { isDelivered, lastDelivered, viewCount, isLoading: isLoadingDelivery } = useMessageDeliveryStatus(id || '');
  
  // Use our custom hook for message actions
  const {
    isActionLoading,
    showSendTestDialog,
    setShowSendTestDialog,
    handleDelete,
    onArmMessage,
    onDisarmMessage,
    onSendTestMessage,
    handleSendTestMessages
  } = useMessageActions(id, conditionId, setIsArmed);
  
  // Get the recipient rendering function
  const { renderRecipients } = MessageRecipientProvider({ recipients });
  
  // Show content immediately without any artificial delays
  useEffect(() => {
    // Mark the UI as ready to display immediately
    setIsRendered(true);
    
    // Listen for condition updates to refresh data
    const handleConditionUpdated = () => {
      console.log('[MessageDetail] Condition updated event received');
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    
    // Add listener for deadline reached event
    const handleDeadlineReached = (event: Event) => {
      if (!id || !isArmed) return;
      
      // Check if this is a deadman's switch (no_check_in condition)
      if (condition && condition.condition_type === 'no_check_in') {
        console.log('[MessageDetail] Deadline reached event received, attempting to trigger message delivery');
        
        // Attempt automatic delivery
        triggerDeadmanSwitch(id).catch(error => {
          console.error('[MessageDetail] Failed to auto-trigger deadman switch on deadline reached:', error);
        });
      }
    };
    
    window.addEventListener('deadline-reached', handleDeadlineReached);
    
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
      window.removeEventListener('deadline-reached', handleDeadlineReached);
    };
  }, [id, isArmed, condition]);
  
  // Show minimal loading state only when absolutely necessary
  if (!isRendered || (isLoading && !message)) {
    return <MessageLoading message="Loading message..." />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <MessageDetailContent
      message={message}
      isLoading={isLoading} // Pass loading state for progressive UI
      isArmed={isArmed}
      isActionLoading={isActionLoading}
      deadline={deadline}
      conditionId={conditionId}
      condition={condition}
      handleDisarmMessage={onDisarmMessage}
      handleArmMessage={onArmMessage}
      handleDelete={handleDelete}
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
      refreshTrigger={refreshCount}
    />
  );
}
