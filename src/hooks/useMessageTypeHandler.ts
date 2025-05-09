
import { useState, useEffect, useRef } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";

// Helper to check if a string is JSON from media content
const isJsonMediaContent = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === "object";
  } catch (e) {
    return false;
  }
};

export function useMessageTypeHandler() {
  const [messageType, setMessageType] = useState("text");
  const { 
    content, 
    setContent, 
    textContent, 
    setTextContent, 
    videoContent, 
    setVideoContent 
  } = useMessageForm();
  
  const previousMessageTypeRef = useRef(messageType);

  // Effect to update the previous message type ref when message type changes
  useEffect(() => {
    previousMessageTypeRef.current = messageType;
  }, [messageType]);
  
  // Function to handle text type button click - Immediately restore content
  const handleTextTypeClick = () => {
    // Explicitly set content to textContent immediately for text type
    setContent(textContent);
  };
  
  // Function to handle the media type button click
  const handleMediaTypeClick = () => {
    if (videoContent) {
      setContent(videoContent);
    }
  };

  return {
    messageType,
    setMessageType,
    handleTextTypeClick,
    handleMediaTypeClick
  };
}
