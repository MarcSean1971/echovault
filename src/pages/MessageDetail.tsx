
import { useParams } from "react-router-dom";
import { useCallback, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { RealtimeConditionSync } from "@/components/message/detail/RealtimeConditionSync";

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use memoized callback for error navigation
  const handleError = useCallback(() => {
    toast({
      title: "Error",
      description: "Could not load message details",
      variant: "destructive"
    });
    navigate("/messages");
  }, [navigate]);
  
  // Get minimal message data first for immediate display - show UI ASAP
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
  
  // Back button component
  const backButton = (
    <Button 
      variant="ghost" 
      onClick={() => navigate("/messages")}
      className={`mb-6 hover:bg-muted/80 hover:text-foreground ${HOVER_TRANSITION}`}
    >
      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Messages
    </Button>
  );
  
  // ENHANCED: Set up event listeners for conditions, deadline, and delivery completion
  useEffect(() => {
    // Listen for condition updates to refresh data
    const handleConditionUpdated = () => {
      console.log('[MessageDetail] Condition updated event received');
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    
    // ENHANCED: Listen for delivery completion events
    const handleDeliveryComplete = async (event: Event) => {
      if (!id || !(event instanceof CustomEvent)) return;
      
      const { messageId, deliveryType } = event.detail || {};
      
      // Only handle if this event is for this specific message
      if (messageId && messageId !== id) return;
      
      console.log('[MessageDetail] Delivery completion event received for this message');
      
      try {
        // Show completion feedback
        toast({
          title: "Message Delivered Successfully",
          description: "Your message has been delivered and the system has been reset.",
          duration: 8000,
        });
        
        // Force refresh the condition state immediately
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { 
            messageId: id,
            conditionId: conditionId,
            action: 'delivery-complete-page-refresh',
            source: 'message-detail-page',
            deliveryType: deliveryType,
            timestamp: new Date().toISOString(),
            forceReset: true
          }
        }));
        
      } catch (error) {
        console.error('[MessageDetail] Failed to handle delivery completion:', error);
      }
    };
    
    window.addEventListener('message-delivery-complete', handleDeliveryComplete);
    
    // Listen for deadline reached event
    const handleDeadlineReached = async (event: Event) => {
      if (!id || !isArmed || !(event instanceof CustomEvent)) return;
      
      const { messageId, conditionId: eventConditionId } = event.detail || {};
      
      // Only handle if this event is for this specific message
      if (messageId && messageId !== id) return;
      
      console.log('[MessageDetail] Deadline reached event received for this message');
      
      try {
        // Show immediate feedback
        toast({
          title: "Message Delivered",
          description: "Your message deadline was reached and has been automatically delivered.",
          duration: 8000,
        });
        
        // Check if this is a deadman's switch
        if (condition && condition.condition_type === 'no_check_in') {
          console.log('[MessageDetail] Triggering deadman switch delivery');
          await triggerDeadmanSwitch(id);
          
          // Emit delivery completion event after successful delivery
          window.dispatchEvent(new CustomEvent('message-delivery-complete', { 
            detail: { 
              messageId: id,
              conditionId: eventConditionId || conditionId,
              deliveryType: 'deadline-automatic',
              source: 'message-detail-page',
              completedAt: new Date().toISOString()
            }
          }));
        }
        
      } catch (error) {
        console.error('[MessageDetail] Failed to handle deadline reached:', error);
        toast({
          title: "Delivery Error",
          description: "There was an issue delivering your message. Please check manually.",
          variant: "destructive",
          duration: 8000,
        });
      }
    };
    
    window.addEventListener('deadline-reached', handleDeadlineReached);
    
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
      window.removeEventListener('message-delivery-complete', handleDeliveryComplete);
      window.removeEventListener('deadline-reached', handleDeadlineReached);
    };
  }, [id, isArmed, condition, conditionId]);
  
  // Show minimal loading state just for a brief moment
  if (isLoading && !message) {
    return <MessageLoading message="Loading message..." />;
  }

  if (!message) {
    return <MessageNotFound isInitialLoading={isLoading} />;
  }

  // Render the page with all available data immediately
  return (
    <>
      {/* Add the RealtimeConditionSync component to listen for WhatsApp check-ins */}
      <RealtimeConditionSync />
      
      <MessageDetailContent
        message={message}
        isLoading={false} // Never use skeleton loaders to block UI rendering
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
        backButton={backButton}
      />
    </>
  );
}
