
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { fetchMessageCardsData, fetchMessages } from "@/services/messages/messageService";
import { fetchMessageConditions, invalidateConditionsCache } from "@/services/messages/conditionService";
import { Message, MessageCondition } from "@/types/message";

export function useMessageList() {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [conditions, setConditions] = useState<MessageCondition[]>([]);
  const [panicMessages, setPanicMessages] = useState<Message[]>([]);
  const [regularMessages, setRegularMessages] = useState<Message[]>([]);
  const [reminderRefreshTrigger, setReminderRefreshTrigger] = useState(0);
  
  // Optimized data loading function
  const loadData = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      console.log("Fetching messages and conditions for user:", userId);
      
      // Fetch messages and conditions in parallel
      const [messageData, conditionsData] = await Promise.all([
        fetchMessageCardsData(),
        fetchMessageConditions(userId)
      ]);
      
      console.log("Message cards fetched:", messageData?.length || 0);
      console.log("Conditions fetched:", conditionsData?.length || 0);
      
      // Update state with fetched data
      setMessages(messageData);
      setConditions(conditionsData);
      
      // Categorize messages
      const panic: Message[] = [];
      const regular: Message[] = [];
      
      messageData.forEach(message => {
        // Find the condition for this message
        const condition = conditionsData.find(c => c.message_id === message.id);
        
        if (condition && condition.condition_type === 'panic_trigger') {
          panic.push(message);
        } else {
          regular.push(message);
        }
      });
      
      console.log("Panic messages:", panic.length);
      console.log("Regular messages:", regular.length);
      
      setPanicMessages(panic);
      setRegularMessages(regular);
      
      // Also update reminder refresh trigger to force batched reminders to reload
      setReminderRefreshTrigger(prev => prev + 1);
      
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load your messages: " + (error?.message || "Unknown error"),
        variant: "destructive"
      });
      
      // Clear message states on error
      setMessages([]);
      setPanicMessages([]);
      setRegularMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    console.log("[useMessageList] Force refreshing all data");
    if (userId) {
      invalidateConditionsCache(userId);
    }
    loadData();
    setReminderRefreshTrigger(prev => prev + 1);
  }, [userId, loadData]);
  
  // Initial data loading
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // FIXED: Stable event listener for conditions updates
  useEffect(() => {
    const handleConditionsUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { action, source, messageId } = event.detail || {};
        console.log("[useMessageList] Received conditions-updated event:", { action, source, messageId });
        
        // Force refresh for check-in events from WhatsApp
        if (action === 'check-in' && source === 'whatsapp') {
          console.log("[useMessageList] WhatsApp check-in detected, force refreshing");
          setTimeout(() => forceRefresh(), 100); // Small delay to ensure DB update is complete
        } else if (action === 'arm' || action === 'disarm') {
          console.log("[useMessageList] Arm/disarm event, refreshing data");
          forceRefresh();
        } else {
          // Regular refresh for other events
          forceRefresh();
        }
      }
    };
    
    console.log("[useMessageList] Setting up stable conditions-updated listener");
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    
    return () => {
      console.log("[useMessageList] Removing conditions-updated listener");
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [forceRefresh]); // Only depend on forceRefresh

  // ADDED: Periodic refresh fallback to catch missed events
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[useMessageList] Periodic refresh fallback");
      forceRefresh();
    }, 30000); // Refresh every 30 seconds as fallback
    
    return () => clearInterval(interval);
  }, [forceRefresh]);

  return {
    messages,
    panicMessages,
    regularMessages,
    isLoading,
    reminderRefreshTrigger,
    forceRefresh
  };
}
