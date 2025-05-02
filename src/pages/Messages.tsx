
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { MessageFilter } from "@/components/message/MessageFilter";
import { MessageGrid } from "@/components/message/MessageGrid";
import { fetchMessages, deleteMessage } from "@/services/messages/messageService";
import { Message } from "@/types/message";

export default function Messages() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageType, setMessageType] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    const loadMessages = async () => {
      setIsLoading(true);
      
      try {
        const data = await fetchMessages(messageType);
        setMessages(data);
      } catch (error: any) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load your messages",
          variant: "destructive"
        });
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
      
      setMessages(messages.filter(message => message.id !== id));
      
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
        <Button onClick={() => navigate("/create-message")}>
          Create New Message
        </Button>
      </div>

      <MessageGrid 
        messages={messages} 
        isLoading={isLoading} 
        onDelete={handleDelete} 
      />
    </div>
  );
}
