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

  // Listen for condition-updated events
  useEffect(() => {
    const handleConditionEvents = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { action, source, enhanced, messageId } = event.detail || {};
      
      console.log("[Messages] Received condition event:", { action, source, enhanced, messageId });
      
      // Handle WhatsApp check-ins with appropriate delays
      if (action === 'check-in' && source === 'whatsapp' && enhanced) {
        console.log("[Messages] Enhanced WhatsApp check-in event, delayed refresh");
        
        setTimeout(() => {
          console.log("[Messages] Executing delayed refresh for enhanced WhatsApp check-in");
          forceRefresh();
          forceReminderRefresh();
          setLocalReminderRefreshTrigger(prev => prev + 1);
        }, 700);
        
      } else if (action === 'check-in' && source === 'whatsapp') {
        console.log("[Messages] Standard WhatsApp check-in event, delayed refresh");
        
        setTimeout(() => {
          console.log("[Messages] Executing delayed refresh for standard WhatsApp check-in");
          forceRefresh();
          forceReminderRefresh();
          setLocalReminderRefreshTrigger(prev => prev + 1);
        }, 1000);
        
      } else if (action === 'arm' || action === 'disarm') {
        console.log(`[Messages] Received ${action} event, refreshing reminders`);
        
        forceRefresh();
        forceReminderRefresh();
        setLocalReminderRefreshTrigger(prev => prev + 1);
      } else if (action === 'update') {
        console.log("[Messages] General update event, refreshing data");
        forceRefresh();
      }
    };
    
    console.log("[Messages] Setting up condition event listener");
    window.addEventListener('conditions-updated', handleConditionEvents);
    
    return () => {
      console.log("[Messages] Removing condition event listener");
      window.removeEventListener('conditions-updated', handleConditionEvents);
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
