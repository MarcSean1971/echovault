
import { useState, useEffect, useCallback, useRef } from "react";
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
  
  // Use ref to track if we're currently loading to prevent race conditions
  const isLoadingRef = useRef(false);
  
  // Optimized data loading function
  const loadData = useCallback(async () => {
    if (!userId || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      console.log("[useMessageList] Fetching messages and conditions for user:", userId);
      
      // Fetch messages and conditions in parallel
      const [messageData, conditionsData] = await Promise.all([
        fetchMessageCardsData(),
        fetchMessageConditions(userId)
      ]);
      
      console.log("[useMessageList] Message cards fetched:", messageData?.length || 0);
      console.log("[useMessageList] Conditions fetched:", conditionsData?.length || 0);
      
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
      
      console.log("[useMessageList] Panic messages:", panic.length);
      console.log("[useMessageList] Regular messages:", regular.length);
      
      setPanicMessages(panic);
      setRegularMessages(regular);
      
      // Also update reminder refresh trigger to force batched reminders to reload
      setReminderRefreshTrigger(prev => prev + 1);
      
    } catch (error: any) {
      console.error("[useMessageList] Error loading data:", error);
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
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [userId]);

  // Force refresh function with debouncing
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
  
  // Listen for conditions updates with WhatsApp check-in delays
  useEffect(() => {
    const handleConditionsUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { action, source, messageId, enhanced } = event.detail || {};
        console.log("[useMessageList] Received conditions-updated event:", { action, source, messageId, enhanced });
        
        // Handle WhatsApp check-ins with delays
        if (action === 'check-in' && source === 'whatsapp' && enhanced) {
          console.log("[useMessageList] Enhanced WhatsApp check-in detected, delayed force refresh");
          setTimeout(() => {
            console.log("[useMessageList] Executing delayed refresh for enhanced WhatsApp check-in");
            forceRefresh();
          }, 500);
          
        } else if (action === 'check-in' && source === 'whatsapp') {
          console.log("[useMessageList] Standard WhatsApp check-in detected, delayed force refresh");
          setTimeout(() => {
            console.log("[useMessageList] Executing delayed refresh for standard WhatsApp check-in");
            forceRefresh();
          }, 1200);
          
        } else if (action === 'arm' || action === 'disarm') {
          console.log("[useMessageList] Arm/disarm event, refreshing data");
          forceRefresh();
        } else {
          // Regular refresh for other events
          console.log("[useMessageList] General update event, refreshing");
          forceRefresh();
        }
      }
    };
    
    console.log("[useMessageList] Setting up conditions-updated listener");
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    
    return () => {
      console.log("[useMessageList] Removing conditions-updated listener");
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
