
import { useState, useEffect } from "react";
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
  
  // Store content separately for each message type
  const [textContent, setTextContent] = useState("");
  const [audioContent, setAudioContent] = useState("");
  const [videoContent, setVideoContent] = useState("");
  
  // Save and restore content when message type changes
  useEffect(() => {
    // First, save the current content to the appropriate state based on previous type
    if (content) {
      switch (messageType) {
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
    
    // Then restore content based on the new message type
    switch (messageType) {
      case "text":
        // When switching to text mode, if we have saved text content, use that
        // otherwise use an empty string to prevent JSON from appearing
        setContent(textContent || "");
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
  }, [messageType]);
  
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
