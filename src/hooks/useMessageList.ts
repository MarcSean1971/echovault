
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { fetchMessageCardsData, fetchMessages } from "@/services/messages/messageService";
import { fetchMessageConditions, invalidateConditionsCache } from "@/services/messages/conditionService";
import { Message, MessageCondition } from "@/types/message";

export function useMessageList(messageType: string | null) {
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
      
      // Fetch messages and conditions in parallel - use the optimized fetchMessageCardsData function
      const [messageData, conditionsData] = await Promise.all([
        fetchMessageCardsData(messageType),
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
  }, [userId, messageType]);

  // Force refresh function
  const forceRefresh = useCallback(() => {
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
  
  // Listen for conditions-updated event
  useEffect(() => {
    const handleConditionsUpdated = () => {
      console.log("Messages page received conditions-updated event, refreshing data");
      forceRefresh();
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
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
