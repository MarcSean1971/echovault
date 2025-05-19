
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
    
    // Set to loading but don't block UI
    setIsLoading(true);
    
    // Use setTimeout to defer processing to after page render is complete
    const timer = setTimeout(() => {
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
    }, 1000); // Delay by 1 second to ensure page loads first
    
    return () => clearTimeout(timer);
  }, [message]);
  
  return { transcription, isLoading };
}
