
import { useMessageTypeHandler } from "./useMessageTypeHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useEffect } from "react";
import { useMessageTypeState } from "./useMessageTypeState";
import { useVideoCache } from "./useVideoCache";
import { parseMessageTranscription } from "@/services/messages/mediaService";

export function useMessageTypeManager() {
  const { messageType, setMessageType: setContextMessageType, content } = useMessageForm();
  const {
    handleTextTypeClick, handleMediaTypeClick
  } = useMessageTypeHandler();

  const { handleMessageTypeChange } = useMessageTypeState();
  const { cachedVideoBlob, cachedVideoUrl, cachedTranscription, cacheVideo, clearCache } = useVideoCache();
  
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

  // Extract transcription from the current content
  const getCurrentTranscription = () => {
    if (!content) return null;
    return parseMessageTranscription(content);
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
  
  // Wrapper functions for message type handling
  const onTextTypeClick = () => {
    // Save the current video state and transcription before switching to text
    const currentTranscription = getCurrentTranscription();
    console.log("Switching to text mode. Current transcription:", currentTranscription);
    
    if (videoBlob && videoUrl) {
      console.log("Caching video before switching to text mode");
      cacheVideo(videoBlob, videoUrl, currentTranscription);
    }
    
    handleTextTypeClick();
    handleMessageTypeChange("text");
    setContextMessageType("text");
    
    // If we were in video mode, clean up the camera stream but don't clear the video
    if (previewStream) {
      stopMediaStream();
    }
  };
  
  // When switching to video type, initialize the camera stream or restore video
  const onVideoTypeClick = () => {
    handleMediaTypeClick();
    handleMessageTypeChange("video");
    setContextMessageType("video");
    
    // If we have cached video, restore it first
    if (cachedVideoBlob && cachedVideoUrl) {
      console.log("Restoring cached video after switching back to video mode");
      console.log("Cached transcription:", cachedTranscription);
      restoreVideo(cachedVideoBlob, cachedVideoUrl, cachedTranscription);
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
      
      clearCache();
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
