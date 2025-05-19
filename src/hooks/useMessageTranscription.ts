
import { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseMessageTranscription } from "@/services/messages/mediaService";

export function useMessageTranscription(message: Message) {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Skip processing for non-video messages
    if (!message || message.message_type !== 'video') {
      setTranscription(null);
      return;
    }
    
    setIsLoading(true);
    
    // Use requestAnimationFrame to process transcription without blocking the UI
    requestAnimationFrame(() => {
      try {
        // Extract transcription from video content - fast operation
        const extractedTranscription = parseMessageTranscription(
          message.video_content || message.content
        );
        
        // Update state with extracted transcription
        setTranscription(extractedTranscription);
      } catch (error) {
        console.error("Error extracting transcription:", error);
        setTranscription(null);
      } finally {
        setIsLoading(false);
      }
    });
  }, [message]);
  
  return { transcription, isLoading };
}
