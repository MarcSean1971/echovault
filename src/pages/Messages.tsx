
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { MessageFilter } from "@/components/message/MessageFilter";
import { MessageGrid } from "@/components/message/MessageGrid";
import { fetchMessages, deleteMessage } from "@/services/messages/messageService";
import { Message, MessageCondition } from "@/types/message";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { fetchMessageConditions, invalidateConditionsCache } from "@/services/messages/conditionService";
import { PlusCircle } from "lucide-react";
import { useBatchedReminders } from "@/hooks/useBatchedReminders";

export default function Messages() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageType, setMessageType] = useState<string | null>(null);
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
        fetchMessages(messageType),
        fetchMessageConditions(userId)
      ]);
      
      console.log("Messages fetched:", messageData?.length || 0);
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
  
  // Get all message IDs for reminder fetching
  const allMessageIds = messages.map(message => message.id);
  
  // Fetch reminders for all messages in a single batch query
  const { reminders: reminderData, forceRefresh: forceReminderRefresh } = useBatchedReminders(
    allMessageIds, 
    reminderRefreshTrigger
  );
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Listen for conditions-updated event
  useEffect(() => {
    const handleConditionsUpdated = () => {
      console.log("Messages page received conditions-updated event, refreshing data");
      // Invalidate cache and reload data
      if (userId) {
        invalidateConditionsCache(userId);
      }
      loadData();
      // Also refresh reminder data
      forceReminderRefresh();
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [userId, loadData, forceReminderRefresh]);
  
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
      await deleteMessage(id);
      
      // Remove from all appropriate state arrays
      setMessages(messages.filter(message => message.id !== id));
      setPanicMessages(panicMessages.filter(message => message.id !== id));
      setRegularMessages(regularMessages.filter(message => message.id !== id));
      
      toast({
        title: "Message deleted",
        description: "Your message has been permanently deleted",
      });
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete the message",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Your Messages
        </h1>
        <p className="text-muted-foreground mt-1">
          Secure communications that transcend time and circumstances
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <MessageFilter 
          messageType={messageType} 
          onFilterChange={setMessageType} 
        />
        <Button 
          onClick={() => navigate("/create-message")}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} gap-2 shadow-sm hover:shadow-md`}
          size="lg"
        >
          <PlusCircle className="h-5 w-5" />
          Create New Message
        </Button>
      </div>
      
      {/* Display panic messages first if any exist */}
      {panicMessages.length > 0 && (
        <div className="mb-8 animate-fade-in rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-red-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
            Emergency Panic Messages
          </h2>
          <MessageGrid 
            messages={panicMessages} 
            isLoading={isLoading} 
            onDelete={handleDelete}
            reminderData={reminderData}
          />
        </div>
      )}
      
      {/* Display regular messages (deadman's switch) */}
      <div className={panicMessages.length > 0 ? "mt-6 animate-fade-in" : "animate-fade-in"}>
        {panicMessages.length > 0 && (
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
              <path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.75 6.75 0 1113.5 0v4.661c0 .326.277.585.6.544.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z" />
              <path fillRule="evenodd" d="M9.75 15.75a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
            Deadman's Switch Messages
          </h2>
        )}
        <MessageGrid 
          messages={regularMessages} 
          isLoading={isLoading} 
          onDelete={handleDelete}
          reminderData={reminderData}
        />
      </div>
    </div>
  );
}
