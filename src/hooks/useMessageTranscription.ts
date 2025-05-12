
import { useState, useEffect } from "react";
import { Message } from "@/types/message";

export function useMessageTranscription(message: Message) {
  const [transcription, setTranscription] = useState<string | null>(null);
  
  // Try to extract transcription from content for voice/video messages
  useEffect(() => {
    if (message.message_type !== 'text' && message.content) {
      try {
        const contentObj = JSON.parse(message.content);
        if (contentObj.transcription) {
          setTranscription(contentObj.transcription);
        }
      } catch (e) {
        // Not JSON or no transcription field, use content as is
        setTranscription(message.content);
      }
    }
  }, [message]);
  
  return { transcription };
}
