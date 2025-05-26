
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

  // ENHANCED: Listen for condition-updated events with immediate WhatsApp handling and new reminder events
  useEffect(() => {
    const handleConditionEvents = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { action, source, enhanced, messageId } = event.detail || {};
      
      console.log("[Messages] Received condition event:", { action, source, enhanced, messageId });
      
      // IMMEDIATE handling for WhatsApp check-ins - no delays
      if (action === 'check-in' && source === 'whatsapp') {
        console.log("[Messages] WhatsApp check-in event, IMMEDIATE refresh");
        
        forceRefresh();
        forceReminderRefresh();
        setLocalReminderRefreshTrigger(prev => prev + 1);
        
      } else if (action === 'arm' || action === 'disarm') {
        console.log(`[Messages] Received ${action} event, refreshing reminders`);
        
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
    
    // Listen for reminder-specific events
    const handleReminderEvents = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { messageId, action } = event.detail || {};
      
      console.log("[Messages] Received reminder event:", { messageId, action });
      
      // Refresh when reminder status changes
      forceRefresh();
      forceReminderRefresh();
      setLocalReminderRefreshTrigger(prev => prev + 1);
    };
    
    console.log("[Messages] Setting up condition and reminder event listeners");
    window.addEventListener('conditions-updated', handleConditionEvents);
    window.addEventListener('message-reminder-updated', handleReminderEvents);
    
    return () => {
      console.log("[Messages] Removing condition and reminder event listeners");
      window.removeEventListener('conditions-updated', handleConditionEvents);
      window.removeEventListener('message-reminder-updated', handleReminderEvents);
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
