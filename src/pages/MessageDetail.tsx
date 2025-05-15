
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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

  // Function to manually trigger the deadman's switch
  const handleForceDelivery = async () => {
    if (!id) return;

    try {
      toast({
        title: "Forcing message delivery",
        description: "Manually triggering message delivery...",
        duration: 3000,
      });
      
      // Call our dedicated edge function
      const { data, error } = await supabase.functions.invoke('deadman-switch-trigger', {
        body: { messageId: id }
      });
      
      if (error) {
        console.error(`Error forcing delivery for message ${id}:`, error);
        toast({
          title: "Delivery failed",
          description: error.message || "Failed to deliver the message.",
          variant: "destructive",
          duration: 5000,
        });
        throw error;
      }
      
      console.log(`Force delivery successful for message ${id}:`, data);
      toast({
        title: "Message delivered",
        description: "Your message has been delivered to all recipients.",
        duration: 5000,
      });
      
      // Refresh data after successful delivery
      setRefreshTrigger(prev => prev + 1);
      
      // Dispatch event to refresh UI
      window.dispatchEvent(new CustomEvent('message-delivered', { 
        detail: { 
          messageId: id,
          deliveredAt: new Date().toISOString() 
        }
      }));
      
      return data;
    } catch (error: any) {
      console.error(`Error in force delivery for message ${id}:`, error);
      throw error;
    }
  };

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

