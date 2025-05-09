
import { useState, useEffect, useRef } from "react";
import { MediaType } from "./useMediaRecording";
import { useMessageForm } from "@/components/message/MessageFormContext";

// Helper to check if a string is JSON from media content
const isJsonMediaContent = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content);
    // Check if it has videoData property (which indicates it's from media)
    return (
      typeof parsed === "object" && 
      (parsed.videoData !== undefined)
    );
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
  const [videoContent, setVideoContent] = useState("");

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
        case "video":
          setVideoContent(content);
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
  
  // Function to handle the media type button click
  const handleMediaTypeClick = (
    mediaType: MediaType,
    setShowRecorder: (show: boolean) => void, 
    mediaBlob: Blob | null
  ) => {
    // Immediately set the appropriate content based on media type
    if (mediaType === "video") {
      setContent(videoContent);
    }
    
    // Directly set the recorder to visible - this is the key change
    console.log(`Setting ${mediaType} recorder to visible`);
    setShowRecorder(true);
  };

  // Convenience wrapper for video
  const handleVideoTypeClick = (setShowVideoRecorder: (show: boolean) => void, videoBlob: Blob | null) => {
    handleMediaTypeClick("video", setShowVideoRecorder, videoBlob);
  };

  return {
    messageType,
    setMessageType,
    handleTextTypeClick,
    handleVideoTypeClick,
    handleMediaTypeClick
  };
}
