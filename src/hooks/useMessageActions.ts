
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { deleteMessage, handleArmMessage, handleDisarmMessage } from "@/services/messages/messageDetailService";
import { sendTestNotification } from "@/services/messages/notificationService";
import { useConditionRefresh } from "@/hooks/useConditionRefresh";
import { Recipient } from "@/types/message";

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
  
  // Handle message deletion
  const handleMessageDelete = useCallback(async () => {
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
  
  // Change to no-argument function that returns a Promise
  const handleSendTestMessages = useCallback(async () => {
    if (!messageId) return;
    
    try {
      setIsActionLoading(true);
      
      await sendTestNotification(messageId);
      
      setShowSendTestDialog(false);
      
      toast({
        title: "Test message sent",
        description: "Your test message has been sent to selected recipients.",
      });
    } catch (error) {
      console.error("Error sending test messages:", error);
      toast({
        title: "Error",
        description: "Failed to send test message",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  }, [messageId]);
  
  return {
    isActionLoading,
    showSendTestDialog,
    setShowSendTestDialog,
    handleMessageDelete,
    onArmMessage,
    onDisarmMessage,
    onSendTestMessage,
    handleSendTestMessages
  };
}
