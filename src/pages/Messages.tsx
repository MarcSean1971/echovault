
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

  // ENHANCED: Initialize Realtime connection with health monitoring
  useEffect(() => {
    console.log("[Messages] Initializing ENHANCED Realtime connection with monitoring");
    
    const initializeRealtime = async () => {
      const success = await enableRealtimeForConditions();
      if (success) {
        console.log("[Messages] Realtime connection established successfully");
        
        // Check connection health periodically
        const healthCheck = setInterval(async () => {
          const status = await checkRealtimeStatus();
          console.log(`[Messages] Realtime health check: ${status}`);
          
          if (status === 'CHANNEL_ERROR' || status === 'NOT_INITIALIZED') {
            console.warn(`[Messages] Realtime connection issue detected (${status}), attempting reconnect`);
            await reconnectRealtime();
          }
        }, 30000); // Check every 30 seconds
        
        return () => clearInterval(healthCheck);
      } else {
        console.warn("[Messages] Failed to establish Realtime connection");
        
        // Retry after 5 seconds
        setTimeout(initializeRealtime, 5000);
      }
    };
    
    const cleanup = initializeRealtime();
    return () => {
      if (cleanup instanceof Function) cleanup();
    };
  }, []);

  // ENHANCED: Listen for condition-updated events with improved WhatsApp check-in handling
  useEffect(() => {
    const handleConditionEvents = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { action, source, enhanced, messageId } = event.detail || {};
      
      console.log("[Messages] Received condition event:", { action, source, enhanced, messageId });
      
      // ENHANCED: WhatsApp check-ins get delayed refresh to ensure DB propagation
      if (action === 'check-in' && source === 'whatsapp' && enhanced) {
        console.log("[Messages] Enhanced WhatsApp check-in event, delayed immediate refresh");
        
        // Delayed refresh for enhanced WhatsApp events to ensure DB updates complete
        setTimeout(() => {
          console.log("[Messages] Executing delayed refresh for enhanced WhatsApp check-in");
          forceRefresh();
          forceReminderRefresh();
          setLocalReminderRefreshTrigger(prev => prev + 1);
        }, 700);
        
      } else if (action === 'check-in' && source === 'whatsapp') {
        console.log("[Messages] Standard WhatsApp check-in event, extended delayed refresh");
        
        // Extended delay for standard WhatsApp check-ins to ensure DB update is complete
        setTimeout(() => {
          console.log("[Messages] Executing extended delayed refresh for standard WhatsApp check-in");
          forceRefresh();
          forceReminderRefresh();
          setLocalReminderRefreshTrigger(prev => prev + 1);
        }, 1000);
        
      } else if (action === 'arm' || action === 'disarm') {
        console.log(`[Messages] Received ${action} event, refreshing reminders`);
        
        // Force refresh message list to update status
        forceRefresh();
        
        // Force refresh reminders directly
        forceReminderRefresh();
        
        // Also increment local trigger for safety
        setLocalReminderRefreshTrigger(prev => prev + 1);
      } else if (action === 'update') {
        console.log("[Messages] General update event, refreshing data");
        forceRefresh();
      }
    };
    
    console.log("[Messages] Setting up ENHANCED condition event listener with WhatsApp delays");
    window.addEventListener('conditions-updated', handleConditionEvents);
    
    return () => {
      console.log("[Messages] Removing condition event listener");
      window.removeEventListener('conditions-updated', handleConditionEvents);
    };
  }, [forceRefresh, forceReminderRefresh]);

  // ADDED: Fallback refresh mechanism for missed updates
  useEffect(() => {
    const fallbackInterval = setInterval(() => {
      console.log("[Messages] Fallback refresh - checking for missed updates");
      forceRefresh();
    }, 60000); // Every 60 seconds as safety net
    
    return () => clearInterval(fallbackInterval);
  }, [forceRefresh]);

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
