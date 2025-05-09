
import { useEffect, useCallback } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { Message } from "@/types/message";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to initialize message data when editing an existing message
 */
export function useMessageInitializer(message?: Message) {
  const { 
    setMessageType: setContextMessageType,
    setContent
  } = useMessageForm();

  // Set initial message type based on the message being edited
  useEffect(() => {
    if (message?.message_type) {
      console.log("Initializing message type:", message.message_type);
      setContextMessageType(message.message_type);
    }
  }, [message, setContextMessageType]);

  // Initialize message content from the message being edited
  useEffect(() => {
    if (!message?.content) return;
    
    console.log("Initializing message content for editing:", message.content.substring(0, 100) + "...");
    console.log("Message type:", message.message_type);
    
    // Set form content regardless of message type
    setContent(message.content);
    
  }, [message, setContent]);
}
