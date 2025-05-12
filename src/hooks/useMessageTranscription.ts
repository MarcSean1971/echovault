
import { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseMessageTranscription } from "@/services/messages/mediaService";

export function useMessageTranscription(message: Message) {
  const [transcription, setTranscription] = useState<string | null>(null);
  
  // Try to extract transcription from content for voice/video messages
  useEffect(() => {
    if (message.message_type !== 'text' && message.content) {
      // Use the dedicated function from mediaService
      const extractedTranscription = parseMessageTranscription(message.content);
      if (extractedTranscription) {
        setTranscription(extractedTranscription);
      } else {
        try {
          // Fallback to direct JSON parsing
          const contentObj = JSON.parse(message.content);
          if (contentObj.transcription) {
            setTranscription(contentObj.transcription);
          }
        } catch (e) {
          // Not JSON or no transcription field
          console.log("Could not extract transcription from message content");
        }
      }
    }
  }, [message]);
  
  return { transcription };
}
