
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { MessageFilter } from "@/components/message/MessageFilter";
import { MessageGrid } from "@/components/message/MessageGrid";
import { fetchMessages, deleteMessage } from "@/services/messages/messageService";
import { Message, MessageCondition } from "@/types/message";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { fetchMessageConditions } from "@/services/messages/conditionService";

export default function Messages() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageType, setMessageType] = useState<string | null>(null);
  const [conditions, setConditions] = useState<MessageCondition[]>([]);
  const [panicMessages, setPanicMessages] = useState<Message[]>([]);
  const [regularMessages, setRegularMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!userId) return;
    
    const loadMessages = async () => {
      setIsLoading(true);
      
      try {
        console.log("Fetching messages and conditions for user:", userId);
        
        // Try to fetch messages first, then conditions if successful
        try {
          const messageData = await fetchMessages(messageType);
          console.log("Messages fetched:", messageData?.length || 0);
          setMessages(messageData);
          
          // Once messages are fetched successfully, get conditions
          try {
            const conditionsData = await fetchMessageConditions(userId);
            console.log("Conditions fetched:", conditionsData?.length || 0);
            setConditions(conditionsData);
            
            // Categorize messages based on their condition types
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
          } catch (conditionsError: any) {
            console.error("Error fetching conditions:", conditionsError);
            // Still show messages even if conditions fail
            toast({
              title: "Warning",
              description: "Failed to load message conditions, some features may be limited",
              variant: "destructive" // Changed from "warning" to "destructive" as it's one of the allowed variants
            });
            
            // If conditions fail, show all messages as regular
            setPanicMessages([]);
            setRegularMessages(messageData);
          }
        } catch (messagesError: any) {
          console.error("Error fetching messages:", messagesError);
          throw messagesError; // Re-throw to the outer catch
        }
      } catch (error: any) {
        console.error("Error in loadMessages:", error);
        toast({
          title: "Error",
          description: "Failed to load your messages: " + (error?.message || "Unknown error"),
          variant: "destructive"
        });
        
        // Clear all message states on error
        setMessages([]);
        setPanicMessages([]);
        setRegularMessages([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [userId, messageType]);
  
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col mb-6">
        <h1 className="text-3xl font-bold">Your Messages</h1>
        <p className="text-muted-foreground mt-1">Secure communications that transcend time and circumstances</p>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <MessageFilter 
          messageType={messageType} 
          onFilterChange={setMessageType} 
        />
        <Button 
          onClick={() => navigate("/create-message")}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
        >
          Create New Message
        </Button>
      </div>
      
      {/* Display panic messages first if any exist */}
      {panicMessages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-red-500">Emergency Panic Messages</h2>
          <MessageGrid 
            messages={panicMessages} 
            isLoading={isLoading} 
            onDelete={handleDelete} 
          />
        </div>
      )}
      
      {/* Display regular messages (deadman's switch) */}
      <div className={panicMessages.length > 0 ? "mt-6" : ""}>
        {panicMessages.length > 0 && (
          <h2 className="text-xl font-semibold mb-4">Deadman's Switch Messages</h2>
        )}
        <MessageGrid 
          messages={regularMessages} 
          isLoading={isLoading} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}
