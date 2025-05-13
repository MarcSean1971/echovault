
import { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseMessageTranscription, parseVideoContent } from "@/services/messages/mediaService";
import { useLocation } from "react-router-dom";

export function useMessageContentTypes(message: Message, conditionType?: string) {
  const [hasVideoContent, setHasVideoContent] = useState(false);
  const [hasTextContent, setHasTextContent] = useState(false);
  const [additionalText, setAdditionalText] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const location = useLocation();
  
  // Check if we're on the message detail page
  const isMessageDetailPage = location.pathname.includes('/message/') && !location.pathname.includes('/edit');
  
  // Check if this is a deadman's switch message
  const isDeadmansSwitch = conditionType === 'no_check_in';
  
  // Extract transcription from message content
  useEffect(() => {
    const extractedTranscription = parseMessageTranscription(message.content);
    setTranscription(extractedTranscription);
  }, [message.content]);
  
  // Check for different types of content
  useEffect(() => {
    if (!message.content) {
      setHasTextContent(message.message_type === "text"); // Set text content true for text type even if empty
      return;
    }

    // Check for video content
    try {
      const { videoData } = parseVideoContent(message.content);
      setHasVideoContent(!!videoData);
      
      // If we have video content, check for additional text
      if (videoData) {
        try {
          const contentObj = JSON.parse(message.content);
          // Only set additionalText if it actually exists and isn't empty
          if (contentObj.additionalText && typeof contentObj.additionalText === 'string' && 
              contentObj.additionalText.trim() !== '') {
            setAdditionalText(contentObj.additionalText);
            console.log("Found additional text:", contentObj.additionalText.substring(0, 50) + "...");
          }
        } catch (e) {
          console.error("Error parsing additional text from video content:", e);
        }
      }
    } catch (e) {
      setHasVideoContent(false);
    }
    
    // For text content, consider any content as text if message type is "text"
    if (message.message_type === "text") {
      setHasTextContent(true);
    } 
    // For non-text message types, check if content could be text
    else if (!message.content.trim().startsWith("{") || 
             message.content.trim() === "{}" || 
             message.content.trim() === "null") {
      setHasTextContent(true);
    }
  }, [message.content, message.message_type]);

  return {
    hasVideoContent,
    hasTextContent,
    additionalText,
    transcription,
    isDeadmansSwitch,
    isMessageDetailPage
  };
}
