
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
  
  // Helper function to clean text from JSON and formatting artifacts
  const cleanTextContent = (text: string): string => {
    if (!text) return "";
    
    // If it's a JSON string, try to extract just the text
    if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(text);
        // If parsed has a text field, use that
        if (parsed.text) return parsed.text;
        // If parsed has a content field, use that
        if (parsed.content) return parsed.content;
        // If parsed has a message field, use that
        if (parsed.message) return parsed.message;
        // If parsed has a note field, use that
        if (parsed.note) return parsed.note;
        
        // If we can't find a specific field, stringify the object and remove the braces
        const stringified = JSON.stringify(parsed);
        if (stringified !== "{}") {
          return stringified.replace(/[{}"]/g, '').replace(/:/g, ': ').replace(/,/g, ', ');
        }
      } catch (e) {
        // Not valid JSON, return as is
        return text;
      }
    }
    
    return text;
  };
  
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
          if (contentObj.additionalText) {
            // Process additionalText to extract clean text without JSON
            const cleanedText = cleanTextContent(contentObj.additionalText);
            setAdditionalText(cleanedText);
            console.log("Found and processed additional text:", cleanedText);
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
    console.log("MessageContent: Additional text:", additionalText);
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
