
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMessageCardsData, deleteMessage as deleteMessageService } from "@/services/messages/messageService";
import { Message } from "@/types/message";
import { toast } from "@/hooks/use-toast";

export function useMessages() {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMessages = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const messageData = await fetchMessageCardsData();
      setMessages(messageData);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessageService(messageId);
      await refreshMessages();
      toast({
        title: "Success",
        description: "Message deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  }, [refreshMessages]);

  useEffect(() => {
    refreshMessages();
  }, [refreshMessages]);

  return {
    messages,
    isLoading,
    deleteMessage,
    refreshMessages
  };
}
