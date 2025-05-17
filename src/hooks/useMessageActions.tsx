
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { deleteMessage } from "@/services/messages/messageService";
import { Message } from "@/types/message";

export function useMessageActions(
  messages: Message[], 
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setPanicMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setRegularMessages: React.Dispatch<React.SetStateAction<Message[]>>
) {
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    setIsDeleting(prev => ({ ...prev, [id]: true }));
    
    try {
      await deleteMessage(id);
      
      // Remove from all appropriate state arrays
      setMessages(messages.filter(message => message.id !== id));
      setPanicMessages(prevPanic => prevPanic.filter(message => message.id !== id));
      setRegularMessages(prevRegular => prevRegular.filter(message => message.id !== id));
      
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
    } finally {
      setIsDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  return {
    handleDelete,
    isDeleting
  };
}
