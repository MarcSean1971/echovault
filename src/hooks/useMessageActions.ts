
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { deleteMessage, handleArmMessage, handleDisarmMessage } from "@/services/messages/messageDetailService";
import { sendTestNotification } from "@/services/messages/notificationService";
import { useConditionRefresh } from "@/hooks/useConditionRefresh";

/**
 * Hook for handling message actions like arming, disarming, deleting, and sending test messages
 */
export function useMessageActions(
  messageId: string | undefined,
  conditionId: string | null,
  setIsArmed: (isArmed: boolean) => void
) {
  const navigate = useNavigate();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showSendTestDialog, setShowSendTestDialog] = useState(false);
  const { refreshConditions } = useConditionRefresh();
  
  // Handle message deletion - renamed to handleDelete for consistency
  const handleDelete = useCallback(async () => {
    if (!messageId) return;
    
    const success = await deleteMessage(messageId);
    if (success) {
      navigate("/messages");
    }
  }, [messageId, navigate]);
  
  // Handle arming a message
  const onArmMessage = useCallback(async () => {
    if (!conditionId) return;
    
    setIsActionLoading(true);
    const newDeadline = await handleArmMessage(conditionId, setIsArmed);
    
    // Refresh conditions data in header buttons
    await refreshConditions();
    
    setIsActionLoading(false);
    
    return newDeadline;
  }, [conditionId, setIsArmed, refreshConditions]);
  
  // Handle disarming a message
  const onDisarmMessage = useCallback(async () => {
    if (!conditionId) return;
    
    setIsActionLoading(true);
    await handleDisarmMessage(conditionId, setIsArmed);
    
    // Refresh conditions data in header buttons
    await refreshConditions();
    
    setIsActionLoading(false);
  }, [conditionId, setIsArmed, refreshConditions]);
  
  // Open the test message dialog
  const onSendTestMessage = useCallback(() => {
    setShowSendTestDialog(true);
  }, []);
  
  // Handle sending test messages to selected recipients
  const handleSendTestMessages = useCallback(async (selectedRecipients: { id: string; name: string; email: string }[]) => {
    if (!messageId || selectedRecipients.length === 0) return;
    
    try {
      setIsActionLoading(true);
      
      // For now we'll use the existing function, but in production we'd
      // want to modify the backend to accept an array of recipients
      await sendTestNotification(messageId);
      
      setShowSendTestDialog(false);
    } catch (error) {
      console.error("Error sending test messages:", error);
    } finally {
      setIsActionLoading(false);
    }
  }, [messageId]);
  
  return {
    isActionLoading,
    showSendTestDialog,
    setShowSendTestDialog,
    handleDelete, // Return handleDelete instead of handleMessageDelete
    onArmMessage,
    onDisarmMessage,
    onSendTestMessage,
    handleSendTestMessages
  };
}
