
import { useState, useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { Message } from "@/types/message";
import { base64ToBlob } from "@/utils/mediaUtils";

export function useMessageInitializer(message?: Message) {
  const { setContent, setTitle, setMessageType } = useMessageForm();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [additionalText, setAdditionalText] = useState<string | null>(null);

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
    setMessageType(message.message_type);
    
    // Mark as initialized
    setHasInitialized(true);
  }, [message, setContent, setTitle, setMessageType]);

  return { 
    hasInitialized,
    videoUrl,
    videoBlob,
    audioUrl,
    audioBlob,
    additionalText
  };
}
