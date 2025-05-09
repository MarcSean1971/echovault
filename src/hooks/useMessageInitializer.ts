
import { useEffect, useCallback } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { Message } from "@/types/message";
import { toast } from "@/components/ui/use-toast";
import { parseVideoContent } from '@/services/messages/mediaService';
import { useInitializeMediaContent } from "./useInitializeMediaContent";

/**
 * Hook to initialize message data when editing an existing message
 */
export function useMessageInitializer(message?: Message) {
  const { 
    setMessageType: setContextMessageType,
    setContent,
    setTextContent,
    setVideoContent
  } = useMessageForm();
  
  // Use our media content initializer hook
  const {
    videoUrl,
    videoBlob,
    videoTranscription,
    hasInitialized
  } = useInitializeMediaContent(message || null);

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
    
    console.log("Initializing message content for editing:", 
                message.content.substring(0, 100) + "...");
    console.log("Message type:", message.message_type);
    
    // Set form content regardless of message type
    setContent(message.content);
    
    // Set the appropriate content type based on the message type
    if (message.message_type === "video") {
      setVideoContent(message.content);
    } else {
      setTextContent(message.content);
    }
    
  }, [message, setContent, setTextContent, setVideoContent]);

  return {
    videoUrl,
    videoBlob,
    videoTranscription,
    hasInitialized
  };
}
