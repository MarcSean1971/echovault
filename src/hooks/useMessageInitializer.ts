
import { useState, useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { Message } from "@/types/message";
import { base64ToBlob } from "@/utils/mediaUtils";

export function useMessageInitializer(message?: Message) {
  const { setContent, setTitle, setMessageType } = useMessageForm();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize form fields from the message
  useEffect(() => {
    if (!message) {
      setHasInitialized(true);
      return;
    }

    // Set title and text content
    setTitle(message.title || "");
    setContent(message.content || "");
    
    // Set message type
    setMessageType(message.message_type as "text" | "audio" | "video");
    
    // Mark as initialized
    setHasInitialized(true);
  }, [message, setContent, setTitle, setMessageType]);

  return { hasInitialized };
}
