
import { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseMessageTranscription } from "@/services/messages/mediaService";

export function useMessageTranscription(message: Message) {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Skip processing for non-video messages or if we don't have a message
    if (!message || message.message_type !== 'video') {
      setTranscription(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Set to loading
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if we already have a transcription in message.text_content
      if (message.text_content && message.text_content.toLowerCase().includes("transcript")) {
        setTranscription(message.text_content);
        setIsLoading(false);
        return;
      }
      
      // Extract transcription from video content - fast operation
      const extractedTranscription = parseMessageTranscription(
        message.video_content || message.content
      );
      
      // Update state with extracted transcription
      setTranscription(extractedTranscription);
    } catch (error) {
      console.error("Error extracting transcription:", error);
      setError("Failed to load transcription");
      setTranscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [message]);
  
  return { transcription, isLoading, error };
}
