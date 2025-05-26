
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { fetchMessageCardsData, fetchMessages } from "@/services/messages/messageService";
import { fetchMessageConditions, invalidateConditionsCache } from "@/services/messages/conditionService";
import { Message, MessageCondition } from "@/types/message";
import { supabase } from "@/integrations/supabase/client";

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
  
  // ENHANCED: Listen for database events from reminder_delivery_log with final delivery priority
  useEffect(() => {
    if (!userId) return;
    
    console.log("[useMessageList] Setting up reminder delivery log listener");
    
    // Listen for events in reminder_delivery_log that indicate frontend should refresh
    const channel = supabase
      .channel('reminder-delivery-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reminder_delivery_log'
        },
        (payload) => {
          console.log("[useMessageList] Received reminder delivery log event:", payload);
          
          const responseData = payload.new?.response_data;
          if (responseData && (
            responseData.event_type === 'conditions-updated' || 
            responseData.event_type === 'message-delivery-complete' ||
            responseData.finalDelivery === true ||
            responseData.reminderType === 'final_delivery'
          )) {
            console.log("[useMessageList] Processing delivery completion event with priority");
            
            // IMMEDIATE force refresh for final delivery events
            if (responseData.finalDelivery === true || responseData.reminderType === 'final_delivery') {
              console.log("[useMessageList] IMMEDIATE: Final delivery event - multiple refreshes");
              
              // Multiple immediate refreshes for final delivery
              forceRefresh();
              setTimeout(() => forceRefresh(), 100);
              setTimeout(() => forceRefresh(), 500);
            } else {
              // Standard refresh for other events
              forceRefresh();
            }
            
            // Also emit a frontend event for immediate component updates
            window.dispatchEvent(new CustomEvent('conditions-updated', { 
              detail: { 
                messageId: responseData.messageId,
                conditionId: responseData.conditionId,
                action: responseData.action || 'delivery-complete',
                source: 'reminder-delivery-log',
                reminderType: responseData.reminderType,
                finalDelivery: responseData.finalDelivery,
                timestamp: new Date().toISOString()
              }
            }));
            
            // ENHANCED: Also emit specific delivery completion event
            if (responseData.finalDelivery === true || responseData.reminderType === 'final_delivery') {
              window.dispatchEvent(new CustomEvent('message-delivery-complete', { 
                detail: { 
                  messageId: responseData.messageId,
                  conditionId: responseData.conditionId,
                  action: 'delivery-complete',
                  reminderType: 'final_delivery',
                  finalDelivery: true,
                  source: 'reminder-delivery-log-final',
                  timestamp: new Date().toISOString()
                }
              }));
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      console.log("[useMessageList] Removing reminder delivery log listener");
      supabase.removeChannel(channel);
    };
  }, [userId, forceRefresh]);
  
  // Keep existing conditions-updated listener for immediate WhatsApp check-ins
  useEffect(() => {
    const handleConditionsUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { action, source, messageId, enhanced, reminderType, finalDelivery } = event.detail || {};
        console.log("[useMessageList] Received conditions-updated event:", { action, source, messageId, enhanced, reminderType, finalDelivery });
        
        // MAXIMUM PRIORITY: Final delivery completion
        if (action === 'delivery-complete' || reminderType === 'final_delivery' || finalDelivery === true) {
          console.log("[useMessageList] MAXIMUM PRIORITY: Final delivery detected - immediate multiple refreshes");
          
          // Multiple immediate refreshes for final delivery
          forceRefresh();
          setTimeout(() => forceRefresh(), 50);
          setTimeout(() => forceRefresh(), 200);
          
        } else if (action === 'check-in' && source === 'whatsapp') {
          console.log("[useMessageList] WhatsApp check-in detected, IMMEDIATE force refresh");
          forceRefresh();
          
        } else if (action === 'arm' || action === 'disarm') {
          console.log("[useMessageList] Arm/disarm event, refreshing data");
          forceRefresh();
        } else if (action === 'delivery-complete' || action === 'reminder-sent') {
          console.log("[useMessageList] Delivery/reminder event, refreshing data");
          forceRefresh();
        } else {
          // Regular refresh for other events
          console.log("[useMessageList] General update event, refreshing");
          forceRefresh();
        }
      }
    };
    
    // ENHANCED: Listen for specific final delivery events
    const handleDeliveryComplete = (event: Event) => {
      if (event instanceof CustomEvent) {
        const { messageId, action, reminderType, finalDelivery } = event.detail || {};
        console.log("[useMessageList] Received delivery complete event:", { messageId, action, reminderType, finalDelivery });
        
        // IMMEDIATE multiple refreshes for delivery completion
        forceRefresh();
        setTimeout(() => forceRefresh(), 100);
        setTimeout(() => forceRefresh(), 300);
      }
    };
    
    console.log("[useMessageList] Setting up ENHANCED conditions-updated and delivery-complete listeners");
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    window.addEventListener('message-delivery-complete', handleDeliveryComplete);
    
    return () => {
      console.log("[useMessageList] Removing ENHANCED conditions-updated and delivery-complete listeners");
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
      window.removeEventListener('message-delivery-complete', handleDeliveryComplete);
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
