
import { useState } from "react";
import { useMessageList } from "@/hooks/useMessageList";
import { useBatchedReminders } from "@/hooks/useBatchedReminders";
import { useMessageActions } from "@/hooks/useMessageActions";
import { MessagesHeader } from "@/components/message/MessagesHeader";
import { MessageCategories } from "@/components/message/MessageCategories";

export default function Messages() {
  const [messageType, setMessageType] = useState<string | null>(null);
  
  // Get message data using our custom hook
  const { 
    messages, 
    panicMessages, 
    regularMessages, 
    isLoading, 
    reminderRefreshTrigger,
    forceRefresh 
  } = useMessageList(messageType);
  
  // State management for messages
  const [messagesState, setMessagesState] = useState(messages);
  const [panicMessagesState, setPanicMessagesState] = useState(panicMessages);
  const [regularMessagesState, setRegularMessagesState] = useState(regularMessages);
  
  // Handle actions like delete - using the correct arguments
  const { handleDelete } = useMessageActions(
    messagesState, 
    setMessagesState, 
    setPanicMessagesState, 
    setRegularMessagesState
  );
  
  // Get all message IDs for reminder fetching
  const allMessageIds = messages.map(message => message.id);
  
  // Fetch reminders for all messages in a single batch query
  const { reminders: reminderData, forceRefresh: forceReminderRefresh } = useBatchedReminders(
    allMessageIds, 
    reminderRefreshTrigger
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <MessagesHeader 
        messageType={messageType}
        onFilterChange={setMessageType}
      />
      
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
