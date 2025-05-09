
import { useMessageTypeHandler } from "./useMessageTypeHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useEffect } from "react";

export function useMessageTypeManager() {
  const { setMessageType: setContextMessageType } = useMessageForm();
  const {
    messageType, setMessageType,
    handleTextTypeClick, handleMediaTypeClick
  } = useMessageTypeHandler();
  
  const {
    isRecording,
    isInitializing,
    hasPermission,
    videoBlob, 
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    previewStream,
    initializeStream,
    startRecording,
    stopRecording,
    clearVideo
  } = useVideoRecordingHandler();

  // Wrapper functions for message type handling
  const onTextTypeClick = () => {
    handleTextTypeClick();
    handleMessageTypeChange("text");
  };
  
  // Sync our local messageType with the context
  const handleMessageTypeChange = (type: string) => {
    setMessageType(type);
    setContextMessageType(type);
  };
  
  // When switching to video type, initialize the camera stream
  const onVideoTypeClick = () => {
    handleMediaTypeClick();
    if (messageType !== "video") {
      handleMessageTypeChange("video");
    }
    
    // Don't show the dialog, instead initialize the preview stream directly
    if (!videoUrl && !previewStream) {
      initializeStream().catch(err => {
        console.error("Failed to initialize camera preview:", err);
      });
    }
  };

  return {
    messageType,
    onTextTypeClick,
    onVideoTypeClick,
    isRecording,
    isInitializing,
    hasPermission,
    videoBlob,
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    previewStream,
    initializeStream,
    startRecording,
    stopRecording,
    clearVideo
  };
}
