
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
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [deadlineMonitorActive, setDeadlineMonitorActive] = useState<boolean>(false);

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

  // Function to trigger the deadman switch manually as a fallback
  const handleForceDelivery = useCallback(async () => {
    if (!id) return;
    
    try {
      console.log(`[MessageDetail] Forcing delivery of message ${id} manually at ${new Date().toISOString()}`);
      
      toast({
        title: "Forcing message delivery",
        description: "Manually triggering message delivery...",
        duration: 3000,
      });
      
      const result = await triggerDeadmanSwitch(id);
      
      if (result.success) {
        console.log(`[MessageDetail] Force delivery successful for message ${id}`);
        // Refresh data after successful delivery
        setRefreshTrigger(prev => prev + 1);
      } else {
        console.error(`[MessageDetail] Force delivery failed for message ${id}:`, result.error);
        toast({
          title: "Delivery failed",
          description: "Failed to deliver the message. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error(`[MessageDetail] Error in force delivery for message ${id}:`, error);
    }
  }, [id]);

  // Listen for condition updates to refresh data
  useEffect(() => {
    const handleConditionUpdated = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    
    // Add listener for message delivery events
    const handleMessageDelivered = () => {
      console.log('[MessageDetail] Message delivered event received, refreshing data');
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('message-delivered', handleMessageDelivered);
    
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
      window.removeEventListener('message-delivered', handleMessageDelivered);
    };
  }, []);
  
  // Enhanced deadline monitoring with automatic delivery check
  useEffect(() => {
    if (!id || !isArmed || !deadline || isDelivered || !condition || condition.condition_type !== 'no_check_in') {
      return;
    }
    
    // Only setup the deadline monitor when we have all required data and it's not already active
    if (!deadlineMonitorActive) {
      console.log(`[MessageDetail] Setting up deadline monitor for message ${id}`);
      setDeadlineMonitorActive(true);
      
      // Add dedicated deadline reached handler with direct trigger
      const handleDeadlineReached = (event: Event) => {
        if (!id || !isArmed) return;
        
        if (event instanceof CustomEvent && event.detail) {
          console.log(`[MessageDetail] Deadline reached event received:`, event.detail);
          
          // Check if this event is for our current deadline
          if (deadline && Math.abs(event.detail.deadlineTime - deadline.getTime()) < 10000) { // Within 10 seconds
            console.log(`[MessageDetail] Deadline confirmed for message ${id}, triggering delivery`);
            
            // Automatic trigger for deadman's switch messages when deadline is reached
            if (condition && condition.condition_type === 'no_check_in') {
              triggerDeadmanSwitch(id).catch(error => {
                console.error(`[MessageDetail] Failed to auto-trigger deadman switch:`, error);
                
                toast({
                  title: "Automatic delivery failed",
                  description: "Please use the 'Force Delivery' button to send the message manually",
                  variant: "destructive",
                  duration: 8000,
                });
              });
            }
          }
        }
      };
      
      window.addEventListener('deadline-reached', handleDeadlineReached);
      
      return () => {
        window.removeEventListener('deadline-reached', handleDeadlineReached);
        setDeadlineMonitorActive(false);
      };
    }
  }, [id, isArmed, deadline, condition, isDelivered, deadlineMonitorActive]);

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
      handleForceDelivery={handleForceDelivery}
    />
  );
}
