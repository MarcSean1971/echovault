
import { useState, useEffect } from "react";
import { MediaType } from "./useMediaRecording";
import { useMessageForm } from "@/components/message/MessageFormContext";

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
          setTextContent(content);
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
