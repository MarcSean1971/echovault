
import { useState, useEffect } from "react";
import { useMessageList } from "@/hooks/useMessageList";
import { useBatchedReminders } from "@/hooks/useBatchedReminders";
import { useMessageActions } from "@/hooks/useMessageActions.tsx";
import { MessagesHeader } from "@/components/message/MessagesHeader";
import { MessageCategories } from "@/components/message/MessageCategories";
import { enableRealtimeForConditions, checkRealtimeStatus, reconnectRealtime } from "@/services/messages/whatsApp/realtimeHelper";

export default function Messages() {
  // Get message data using our custom hook
  const { 
    messages, 
    panicMessages, 
    regularMessages, 
    isLoading, 
    reminderRefreshTrigger,
    forceRefresh 
  } = useMessageList();
  
  // State management for messages
  const [messagesState, setMessagesState] = useState(messages);
  const [panicMessagesState, setPanicMessagesState] = useState(panicMessages);
  const [regularMessagesState, setRegularMessagesState] = useState(regularMessages);
  
  // Local refresh counter to force reminder updates
  const [localReminderRefreshTrigger, setLocalReminderRefreshTrigger] = useState(0);
  
  // Keep state in sync with the data from useMessageList
  useEffect(() => {
    setMessagesState(messages);
    setPanicMessagesState(panicMessages);
    setRegularMessagesState(regularMessages);
  }, [messages, panicMessages, regularMessages]);
  
  // Handle actions like delete
  const { handleDelete } = useMessageActions(
    messages, 
    setMessagesState, 
    setPanicMessagesState, 
    setRegularMessagesState
  );
  
  // Get all message IDs for reminder fetching
  const allMessageIds = messages.map(message => message.id);
  
  // Fetch reminders for all messages in a single batch query
  const { reminders: reminderData, forceRefresh: forceReminderRefresh } = useBatchedReminders(
    allMessageIds, 
    reminderRefreshTrigger + localReminderRefreshTrigger
  );

  // Initialize Realtime connection (once)
  useEffect(() => {
    console.log("[Messages] Initializing Realtime connection");
    
    const initializeRealtime = async () => {
      const success = await enableRealtimeForConditions();
      if (success) {
        console.log("[Messages] Realtime connection established successfully");
      } else {
        console.warn("[Messages] Failed to establish Realtime connection");
      }
    };
    
    initializeRealtime();
  }, []);

  // ENHANCED: FIXED event handling with immediate final delivery priority
  useEffect(() => {
    const handleConditionEvents = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { action, source, enhanced, messageId, reminderType, finalStatus, finalDelivery } = event.detail || {};
      
      console.log("[Messages] Received condition event:", { action, source, enhanced, messageId, reminderType, finalStatus, finalDelivery });
      
      // MAXIMUM PRIORITY: Final delivery completion - IMMEDIATE comprehensive refresh
      if (action === 'delivery-complete' || reminderType === 'final_delivery' || finalDelivery === true) {
        console.log("[Messages] MAXIMUM PRIORITY: Final delivery completion detected - IMMEDIATE comprehensive refresh");
        
        // IMMEDIATE multiple comprehensive refreshes for final delivery
        forceRefresh();
        forceReminderRefresh();
        setLocalReminderRefreshTrigger(prev => prev + 1);
        
        // Multiple immediate refresh cycles for final delivery completion
        setTimeout(() => {
          console.log("[Messages] Secondary final delivery refresh");
          forceRefresh();
          forceReminderRefresh();
          setLocalReminderRefreshTrigger(prev => prev + 1);
        }, 50);
        
        setTimeout(() => {
          console.log("[Messages] Third final delivery refresh");
          forceRefresh();
          forceReminderRefresh();
          setLocalReminderRefreshTrigger(prev => prev + 1);
        }, 200);
        
        setTimeout(() => {
          console.log("[Messages] Final delivery verification refresh");
          forceRefresh();
          setLocalReminderRefreshTrigger(prev => prev + 1);
        }, 1000);
        
      } else if (action === 'check-in' && source === 'whatsapp') {
        console.log("[Messages] IMMEDIATE WhatsApp check-in event");
        
        // Immediate refresh for WhatsApp check-ins
        forceRefresh();
        forceReminderRefresh();
        setLocalReminderRefreshTrigger(prev => prev + 1);
        
      } else if (action === 'arm' || action === 'disarm') {
        console.log(`[Messages] Message ${action} event, refreshing data`);
        
        forceRefresh();
        forceReminderRefresh();
        setLocalReminderRefreshTrigger(prev => prev + 1);
        
      } else if (action === 'reminder-sent' || action === 'reminder-delivered') {
        console.log(`[Messages] Reminder delivery event (${action}), refreshing UI`);
        
        forceRefresh();
        forceReminderRefresh();
        setLocalReminderRefreshTrigger(prev => prev + 1);
        
      } else if (action === 'update') {
        console.log("[Messages] General update event, refreshing data");
        forceRefresh();
      }
    };
    
    // ENHANCED: Listen for final delivery completion events with priority handling
    const handleDeliveryComplete = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { messageId, action, reminderType, finalDelivery, source } = event.detail || {};
      
      console.log("[Messages] Received delivery completion event:", { messageId, action, reminderType, finalDelivery, source });
      
      // IMMEDIATE handling for any delivery completion
      if (action === 'delivery-complete' || reminderType === 'final_delivery' || finalDelivery === true) {
        console.log("[Messages] IMMEDIATE: Delivery completion event - comprehensive refresh");
        
        // Multiple immediate refresh cycles for delivery completion
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            forceRefresh();
            forceReminderRefresh();
            setLocalReminderRefreshTrigger(prev => prev + 1);
          }, i * 100);
        }
      }
    };
    
    // Listen for reminder-specific events with enhanced handling
    const handleReminderEvents = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { messageId, action, reminderType, finalStatus, finalDelivery } = event.detail || {};
      
      console.log("[Messages] Received reminder event:", { messageId, action, reminderType, finalStatus, finalDelivery });
      
      // Prioritize final delivery events
      if (reminderType === 'final_delivery' || action === 'delivery-complete' || finalDelivery === true) {
        console.log("[Messages] PRIORITY: Final delivery reminder event - comprehensive refresh");
        
        // Multiple immediate refresh cycles for final deliveries
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            forceRefresh();
            forceReminderRefresh();
            setLocalReminderRefreshTrigger(prev => prev + 1);
          }, i * 50);
        }
      } else {
        // Standard refresh for other reminder events
        forceRefresh();
        forceReminderRefresh();
        setLocalReminderRefreshTrigger(prev => prev + 1);
      }
    };
    
    console.log("[Messages] Setting up ENHANCED condition and reminder event listeners");
    window.addEventListener('conditions-updated', handleConditionEvents);
    window.addEventListener('message-reminder-updated', handleReminderEvents);
    window.addEventListener('message-delivery-complete', handleConditionEvents);
    window.addEventListener('message-delivery-complete', handleDeliveryComplete);
    window.addEventListener('message-targeted-update', handleConditionEvents);
    
    return () => {
      console.log("[Messages] Removing ENHANCED condition and reminder event listeners");
      window.removeEventListener('conditions-updated', handleConditionEvents);
      window.removeEventListener('message-reminder-updated', handleReminderEvents);
      window.removeEventListener('message-delivery-complete', handleConditionEvents);
      window.removeEventListener('message-delivery-complete', handleDeliveryComplete);
      window.removeEventListener('message-targeted-update', handleConditionEvents);
    };
  }, [forceRefresh, forceReminderRefresh]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <MessagesHeader />
      
      <MessageCategories 
        panicMessages={panicMessages}
        regularMessages={regularMessages}
        isLoading={isLoading}
        onDelete={handleDelete}
        reminderData={reminderData}
      />
    </div>
  );
}
