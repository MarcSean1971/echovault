
import { useState, useEffect, useRef } from "react";
import { MediaType } from "./useMediaRecording";
import { useMessageForm } from "@/components/message/MessageFormContext";

// Helper to check if a string is JSON from media content
const isJsonMediaContent = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content);
    // Check if it has audioData or videoData properties (which indicates it's from media)
    return (
      typeof parsed === "object" && 
      (parsed.audioData !== undefined || parsed.videoData !== undefined)
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
  const [audioContent, setAudioContent] = useState("");
  const [videoContent, setVideoContent] = useState("");

  // Combined effect to handle both saving and restoring content
  useEffect(() => {
    // First, save content from the previous message type
    if (content) {
      switch (previousMessageTypeRef.current) {
        case "text":
          // Only save actual text content, not JSON
          if (!isJsonMediaContent(content)) {
            setTextContent(content);
          }
          break;
        case "audio":
          setAudioContent(content);
          break;
        case "video":
          setVideoContent(content);
          break;
        default:
          break;
      }
    }
    
    // If the message type has changed, restore the appropriate content
    if (messageType !== previousMessageTypeRef.current) {
      // Restore content based on the new message type
      switch (messageType) {
        case "text":
          setContent(textContent);
          break;
        case "audio":
          setContent(audioContent);
          break;
        case "video":
          setContent(videoContent);
          break;
        default:
          setContent("");
          break;
      }
      
      // Update the ref to track the message type change
      previousMessageTypeRef.current = messageType;
    }
  }, [messageType, content, setContent, textContent, audioContent, videoContent]);
  
  // Function to handle text type button click
  const handleTextTypeClick = () => {
    setMessageType("text");
  };
  
  // Function to handle the media type button click
  const handleMediaTypeClick = (
    mediaType: MediaType,
    setShowRecorder: (show: boolean) => void, 
    mediaBlob: Blob | null
  ) => {
    setMessageType(mediaType);
    if (!mediaBlob) {
      setShowRecorder(true);
    }
  };

  // Convenience wrappers for audio and video
  const handleAudioTypeClick = (setShowAudioRecorder: (show: boolean) => void, audioBlob: Blob | null) => {
    handleMediaTypeClick("audio", setShowAudioRecorder, audioBlob);
  };

  const handleVideoTypeClick = (setShowVideoRecorder: (show: boolean) => void, videoBlob: Blob | null) => {
    handleMediaTypeClick("video", setShowVideoRecorder, videoBlob);
  };

  return {
    messageType,
    setMessageType,
    handleTextTypeClick,
    handleAudioTypeClick,
    handleVideoTypeClick,
    handleMediaTypeClick
  };
}
