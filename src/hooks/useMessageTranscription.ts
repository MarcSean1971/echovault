
import { useState, useEffect, useRef } from "react";
import { Message } from "@/types/message";
import { parseMessageTranscription } from "@/services/messages/mediaService";

export function useMessageTranscription(message: Message) {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add a ref to cache parsed transcriptions
  const transcriptionCache = useRef<Map<string, string>>(new Map());
  
  useEffect(() => {
    // Skip processing for non-video messages or if we don't have a message
    if (!message || message.message_type !== 'video') {
      setTranscription(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Set to loading only if we don't have a cached result
    const cacheKey = message.id + (message.video_content || message.content || '');
    const cachedTranscription = transcriptionCache.current.get(cacheKey);
    
    if (cachedTranscription) {
      // Use cached result without setting loading state
      setTranscription(cachedTranscription);
      return;
    }
    
    // Set to loading
    setIsLoading(true);
    setError(null);
    
    // Use a more immediate approach to transcription extraction
    try {
      // Check if we already have a transcription in message.text_content
      if (message.text_content && message.text_content.toLowerCase().includes("transcript")) {
        const result = message.text_content;
        setTranscription(result);
        transcriptionCache.current.set(cacheKey, result);
        setIsLoading(false);
        return;
      }
      
      // Extract transcription from video content - fast operation without delays
      const extractedTranscription = parseMessageTranscription(
        message.video_content || message.content
      );
      
      // Cache the result for future use
      if (extractedTranscription) {
        transcriptionCache.current.set(cacheKey, extractedTranscription);
      }
      
      // Update state with extracted transcription
      setTranscription(extractedTranscription);
    } catch (error) {
      console.error("Error extracting transcription:", error);
      setError("Failed to load transcription");
      setTranscription(null);
    } finally {
      // Always set loading to false to ensure UI updates
      setIsLoading(false);
    }
  }, [message]);
  
  return { transcription, isLoading, error };
}
