
import { useParams } from "react-router-dom";
import { useCallback, useEffect } from "react";
import { MessageDetailContent } from "@/components/message/detail/MessageDetailContent";
import { formatDate, getConditionType } from "@/utils/messageHelpers";
import { MessageRecipientProvider } from "@/components/message/detail/MessageRecipientProvider";
import { useOptimizedMessageDetail } from "@/hooks/useOptimizedMessageDetail";

// Add browser storage key constants
const DEADLINE_STORAGE_KEY = "deadmanswitch_deadline_";

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();

  // Use our optimized hook instead of multiple hooks
  const { 
    message, 
    isLoading, 
    isActionLoading,
    isArmed,
    deadline, 
    conditionId, 
    condition, 
    recipients,
    refreshTrigger,
    showSendTestDialog,
    setShowSendTestDialog,
    handleArmMessage,
    handleDisarmMessage,
    handleDelete,
    onSendTestMessage,
    handleSendTestMessages,
    handleForceDelivery,
    lastCheckIn,
  } = useOptimizedMessageDetail(id);
  
  // Get the recipient rendering function
  const { renderRecipients } = MessageRecipientProvider({ recipients });

  // Function to save deadline to localStorage for offline access
  const saveDeadlineToStorage = useCallback((msgId: string, deadlineTime: number) => {
    try {
      localStorage.setItem(DEADLINE_STORAGE_KEY + msgId, deadlineTime.toString());
    } catch (e) {
      console.error('[MessageDetail] Failed to save deadline to storage:', e);
    }
  }, []);

  // Save deadline to localStorage whenever it changes
  useEffect(() => {
    if (id && isArmed && deadline) {
      saveDeadlineToStorage(id, deadline.getTime());
    }
  }, [id, isArmed, deadline, saveDeadlineToStorage]);
  
  // Delivery status derived from optimized data
  const derivedDeliveryStatus = {
    isDelivered: false, // Set based on condition.delivery_status
    lastDelivered: null,
    viewCount: null,
    isLoading: false
  };

  return (
    <MessageDetailContent
      message={message}
      isLoading={isLoading}
      isArmed={isArmed}
      isActionLoading={isActionLoading}
      deadline={deadline}
      conditionId={conditionId}
      condition={condition}
      handleDisarmMessage={handleDisarmMessage}
      handleArmMessage={handleArmMessage}
      handleDelete={handleDelete}
      formatDate={formatDate}
      renderConditionType={() => getConditionType(condition)}
      renderRecipients={renderRecipients}
      recipients={recipients}
      onSendTestMessage={onSendTestMessage}
      showSendTestDialog={showSendTestDialog}
      setShowSendTestDialog={setShowSendTestDialog}
      handleSendTestMessages={handleSendTestMessages}
      lastCheckIn={lastCheckIn}
      checkInCode={condition?.check_in_code || null}
      lastDelivered={derivedDeliveryStatus.lastDelivered}
      isDelivered={derivedDeliveryStatus.isDelivered}
      viewCount={derivedDeliveryStatus.viewCount}
      isLoadingDelivery={derivedDeliveryStatus.isLoading}
      refreshTrigger={refreshTrigger}
      handleForceDelivery={handleForceDelivery}
    />
  );
}
