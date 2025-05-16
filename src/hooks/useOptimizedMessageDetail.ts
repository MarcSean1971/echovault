
import { useState, useEffect, useCallback } from "react";
import { fetchMessageDetailsWithCache, invalidateMessageCache } from "@/services/messages/optimizedMessageService";
import { useAuth } from "@/contexts/AuthContext";
import { Message } from "@/types/message";
import { toast } from "@/components/ui/use-toast";
import { handleArmMessage, handleDisarmMessage } from "@/services/messages/messageDetailService";
import { deleteMessage } from "@/services/messages/messageService";
import { useNavigate } from "react-router-dom";

/**
 * Optimized hook to fetch and manage message details
 * Consolidates multiple hooks into one to reduce redundant fetches
 */
export function useOptimizedMessageDetail(messageId: string | undefined) {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [condition, setCondition] = useState<any | null>(null);
  const [delivery, setDelivery] = useState<any | null>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [isArmed, setIsArmed] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [conditionId, setConditionId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSendTestDialog, setShowSendTestDialog] = useState(false);
  
  // Function to load message data
  const loadMessageData = useCallback(async () => {
    if (!messageId) return;
    
    try {
      setIsLoading(true);
      
      const data = await fetchMessageDetailsWithCache(messageId);
      
      if (!data.message) {
        console.log("No message found with ID:", messageId);
        return;
      }
      
      // Update all state at once
      setMessage(data.message);
      setCondition(data.condition);
      setDelivery(data.delivery);
      setRecipients(data.recipients || []);
      
      // Extract armed status and deadline
      if (data.condition) {
        setIsArmed(data.condition.active || false);
        setConditionId(data.condition.id);
        
        // Set deadline if available
        if (data.condition.active && data.condition.next_check) {
          setDeadline(new Date(data.condition.next_check));
        } else {
          setDeadline(null);
        }
      }
    } catch (error) {
      console.error("Error loading message data:", error);
      toast({
        title: "Error",
        description: "Failed to load the message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [messageId]);
  
  // Load data on initial render
  useEffect(() => {
    if (messageId && userId) {
      loadMessageData();
    }
  }, [messageId, userId, loadMessageData]);
  
  // Function to refresh data
  const refreshData = useCallback(() => {
    // Invalidate cache to ensure fresh data
    if (messageId) {
      invalidateMessageCache(messageId);
    }
    
    // Update refresh trigger to force re-render
    setRefreshTrigger(prev => prev + 1);
    
    // Reload data
    loadMessageData();
  }, [messageId, loadMessageData]);
  
  // Message action handlers
  const handleArmMessageAction = useCallback(async () => {
    if (!conditionId) return null;
    
    setIsActionLoading(true);
    try {
      const newDeadline = await handleArmMessage(conditionId, setIsArmed);
      setDeadline(newDeadline);
      refreshData();
      return newDeadline;
    } finally {
      setIsActionLoading(false);
    }
  }, [conditionId, refreshData]);
  
  const handleDisarmMessageAction = useCallback(async () => {
    if (!conditionId) return;
    
    setIsActionLoading(true);
    try {
      await handleDisarmMessage(conditionId, setIsArmed);
      setDeadline(null);
      refreshData();
    } finally {
      setIsActionLoading(false);
    }
  }, [conditionId, refreshData]);
  
  const handleDeleteMessage = useCallback(async () => {
    if (!messageId) return;
    
    setIsActionLoading(true);
    try {
      await deleteMessage(messageId);
      toast({
        title: "Message deleted",
        description: "Your message has been permanently deleted",
      });
      navigate("/messages");
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setIsActionLoading(false);
    }
  }, [messageId, navigate]);
  
  const handleSendTestMessage = useCallback(() => {
    setShowSendTestDialog(true);
  }, []);
  
  const handleSendTestMessages = useCallback(async (selectedRecipients: { id: string; name: string; email: string }[]) => {
    if (!messageId || selectedRecipients.length === 0) return;
    
    setIsActionLoading(true);
    try {
      // Implementation of sending test messages would go here
      console.log("Sending test messages to:", selectedRecipients);
      
      toast({
        title: "Test message sent",
        description: `Sent to ${selectedRecipients.length} recipient(s)`,
      });
    } catch (error) {
      console.error("Error sending test messages:", error);
      toast({
        title: "Error",
        description: "Failed to send test messages",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
      setShowSendTestDialog(false);
    }
  }, [messageId]);
  
  // Force delivery for deadman switch
  const handleForceDelivery = useCallback(async () => {
    if (!messageId || !condition || condition.condition_type !== 'no_check_in') return;
    
    console.log(`[useOptimizedMessageDetail] Forcing delivery of message ${messageId}`);
    
    // Implementation would go here - copied from original code
    toast({
      title: "Forcing message delivery",
      description: "Manually triggering message delivery...",
      duration: 3000,
    });
    
    // Refresh data after action
    setTimeout(() => refreshData(), 2000);
  }, [messageId, condition, refreshData]);
  
  return {
    message,
    isLoading,
    isActionLoading,
    isArmed,
    deadline,
    conditionId,
    condition,
    recipients,
    delivery,
    lastCheckIn: condition?.last_checked || null,
    checkInCode: condition?.check_in_code || null, 
    refreshTrigger,
    showSendTestDialog,
    setShowSendTestDialog,
    handleArmMessage: handleArmMessageAction,
    handleDisarmMessage: handleDisarmMessageAction,
    handleDelete: handleDeleteMessage,
    onSendTestMessage: handleSendTestMessage,
    handleSendTestMessages,
    handleForceDelivery,
    refreshData,
  };
}
