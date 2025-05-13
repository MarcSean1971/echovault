
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
          // Set raw additionalText without cleaning - let TextMessageContent handle it
          if (contentObj.additionalText) {
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
  
  // Debug logging for better understanding of content flow
  useEffect(() => {
    console.log(`MessageContent: Rendering message of type: ${message.message_type}`);
    console.log("MessageContent: Message content:", message.content ? message.content.substring(0, 100) + "..." : null);
    console.log("MessageContent: Has video content:", hasVideoContent);
    console.log("MessageContent: Has text content:", hasTextContent);
    console.log("MessageContent: Additional text:", additionalText ? additionalText.substring(0, 50) + "..." : null);
    console.log("MessageContent: Is deadman's switch:", isDeadmansSwitch);
    console.log("MessageContent: Is message detail page:", isMessageDetailPage);
    if (message.message_type === "video") {
      console.log("MessageContent: This is a video message");
      try {
        const { videoData } = parseVideoContent(message.content);
        console.log("MessageContent: Video data available:", !!videoData);
      } catch (e) {
        console.error("Error parsing video data:", e);
      }
    }
  }, [message, hasVideoContent, hasTextContent, additionalText, isDeadmansSwitch, isMessageDetailPage]);

  return {
    hasVideoContent,
    hasTextContent,
    additionalText,
    transcription,
    isDeadmansSwitch,
    isMessageDetailPage
  };
}
