
import { useMessageTypeHandler } from "./useMessageTypeHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useEffect, useState } from "react";

export function useMessageTypeManager() {
  const { setMessageType: setContextMessageType } = useMessageForm();
  const {
    messageType, setMessageType,
    handleTextTypeClick, handleMediaTypeClick
  } = useMessageTypeHandler();
  
  // Add state to store video info when switching tabs
  const [cachedVideoBlob, setCachedVideoBlob] = useState<Blob | null>(null);
  const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null);
  
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
    clearVideo,
    restoreVideo
  } = useVideoRecordingHandler();

  // Wrapper functions for message type handling
  const onTextTypeClick = () => {
    // Save the current video state before switching to text
    if (videoBlob && videoUrl) {
      console.log("Caching video before switching to text mode");
      setCachedVideoBlob(videoBlob);
      setCachedVideoUrl(videoUrl);
    }
    
    handleTextTypeClick();
    handleMessageTypeChange("text");
    
    // If we were in video mode, clean up the camera stream but don't clear the video
    if (previewStream) {
      stopMediaStream();
    }
  };
  
  // Helper function to stop the media stream without clearing the video
  const stopMediaStream = () => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => {
        console.log("Stopping track:", track.kind);
        track.stop();
      });
    }
  };
  
  // Sync our local messageType with the context
  const handleMessageTypeChange = (type: string) => {
    setMessageType(type);
    setContextMessageType(type);
  };
  
  // When switching to video type, initialize the camera stream or restore video
  const onVideoTypeClick = () => {
    handleMediaTypeClick();
    if (messageType !== "video") {
      handleMessageTypeChange("video");
    }
    
    // If we have cached video, restore it first
    if (cachedVideoBlob && cachedVideoUrl) {
      console.log("Restoring cached video after switching back to video mode");
      restoreVideo(cachedVideoBlob, cachedVideoUrl);
      return;
    }
    
    // Don't show the dialog, instead initialize the preview stream directly
    if (!videoUrl && !previewStream) {
      console.log("Video mode selected, initializing camera preview");
      initializeStream().catch(err => {
        console.error("Failed to initialize camera preview:", err);
      });
    }
  };

  // Effect to clean up video resources when component unmounts
  useEffect(() => {
    return () => {
      if (previewStream) {
        clearVideo();
      }
      
      // Clean up cached URLs
      if (cachedVideoUrl) {
        URL.revokeObjectURL(cachedVideoUrl);
      }
    };
  }, []);

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
