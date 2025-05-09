
import { useState } from "react";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useMessageTypeManager() {
  const { setMessageType } = useMessageForm();
  const [initializedFromMessage, setInitializedFromMessage] = useState(false);
  
  // Get video recording handlers
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
    forceInitializeCamera,
    startRecording,
    stopRecording,
    clearVideo,
    restoreVideo,
    stopMediaStream,
    isStreamActive
  } = useVideoRecordingHandler();
  
  // Handle video type selection
  const onVideoTypeClick = async () => {
    console.log("Video type selected");
    setMessageType("video");
  };
  
  // Handle text type selection
  const onTextTypeClick = () => {
    console.log("Text type selected");
    setMessageType("text");
    
    // If we have a camera stream active, stop it
    if (isStreamActive()) {
      console.log("Stopping media stream because text type selected");
      stopMediaStream();
    }
  };
  
  // Handle initialized video data (for message editing)
  const handleInitializedVideo = (blob: Blob, url: string) => {
    console.log("Setting initialized video data from message:", { 
      blobSize: blob.size, 
      hasUrl: !!url 
    });
    
    setInitializedFromMessage(true);
    restoreVideo(blob, url);
  };
  
  return {
    onTextTypeClick,
    onVideoTypeClick,
    videoBlob,
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    isRecording,
    isInitializing,
    hasPermission,
    previewStream,
    initializeStream,
    startRecording,
    stopRecording,
    clearVideo,
    forceInitializeCamera,
    handleInitializedVideo,
    initializedFromMessage
  };
}
