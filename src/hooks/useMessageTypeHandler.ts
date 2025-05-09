
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
  const { content, setContent } = useMessageForm();
  const previousMessageTypeRef = useRef(messageType);
  
  // Store content separately for each message type
  const [textContent, setTextContent] = useState("");

  // Effect to save content when it changes
  useEffect(() => {
    // Save content from the current message type
    if (content) {
      switch (previousMessageTypeRef.current) {
        case "text":
          // Only save actual text content, not JSON
          if (!isJsonMediaContent(content)) {
            setTextContent(content);
          }
          break;
        default:
          break;
      }
    }
  }, [content]);
  
  // Update the previous message type ref when message type changes
  useEffect(() => {
    previousMessageTypeRef.current = messageType;
  }, [messageType]);
  
  // Function to handle text type button click - Immediately restore content
  const handleTextTypeClick = () => {
    // Explicitly set content to textContent immediately for text type
    setContent(textContent);
  };
  
  // Function to handle the media type button click (stub since functionality is removed)
  const handleMediaTypeClick = () => {
    console.log("Media functionality has been removed");
  };

  // Convenience wrapper for video (stub)
  const handleVideoTypeClick = () => {
    console.log("Video functionality has been removed");
  };

  return {
    messageType,
    setMessageType,
    handleTextTypeClick,
    handleVideoTypeClick,
    handleMediaTypeClick
  };
}
