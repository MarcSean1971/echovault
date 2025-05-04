
import { useState } from "react";
import { MediaType } from "./useMediaRecording";

export function useMessageTypeHandler() {
  const [messageType, setMessageType] = useState("text");
  
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
    handleAudioTypeClick,
    handleVideoTypeClick,
    handleMediaTypeClick
  };
}
