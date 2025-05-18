
import { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseMessageTranscription } from "@/services/messages/mediaService";

export function useMessageTranscription(message: Message) {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Skip processing for card view (message.video_content will be null in card view)
    if (!message || message.message_type !== 'video' || !message.video_content) {
      setTranscription(null);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Extract transcription from video content - optimized to only run when video_content is present
      const extractedTranscription = parseMessageTranscription(message.video_content);
      setTranscription(extractedTranscription);
    } catch (error) {
      console.error("Error extracting transcription:", error);
      setTranscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [message]);
  
  return { transcription, isLoading };
}
