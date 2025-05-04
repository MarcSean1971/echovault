
import { useState } from "react";

export function useMessageTypeHandler() {
  const [messageType, setMessageType] = useState("text");
  
  // Function to handle the audio type button click
  const handleAudioTypeClick = (setShowAudioRecorder: (show: boolean) => void, audioBlob: Blob | null) => {
    setMessageType("audio");
    if (!audioBlob) {
      setShowAudioRecorder(true);
    }
  };

  // Function to handle the video type button click
  const handleVideoTypeClick = (setShowVideoRecorder: (show: boolean) => void, videoBlob: Blob | null) => {
    setMessageType("video");
    if (!videoBlob) {
      setShowVideoRecorder(true);
    }
  };

  return {
    messageType,
    setMessageType,
    handleAudioTypeClick,
    handleVideoTypeClick
  };
}
