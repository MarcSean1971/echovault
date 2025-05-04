
import { useState, useEffect } from "react";
import { MediaType } from "./useMediaRecording";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useMessageTypeHandler() {
  const [messageType, setMessageType] = useState("text");
  const { setContent } = useMessageForm();
  
  // Clear content when message type changes to prevent showing JSON in text inputs
  useEffect(() => {
    // Reset content when changing message type to prevent JSON leaking between types
    setContent("");
  }, [messageType, setContent]);
  
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
