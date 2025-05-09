
import { useMessageTypeHandler } from "./useMessageTypeHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useEffect, useState } from "react";
import { useMessageTypeState } from "./useMessageTypeState";
import { useVideoCache } from "./useVideoCache";
import { parseMessageTranscription } from "@/services/messages/mediaService";

export function useMessageTypeManager() {
  const { messageType, setMessageType: setContextMessageType, content } = useMessageForm();
  const { handleTextTypeClick, handleMediaTypeClick } = useMessageTypeHandler();
  const { handleMessageTypeChange } = useMessageTypeState();
  const { cachedVideoBlob, cachedVideoUrl, cachedTranscription, cacheVideo, clearCache, hasCachedVideo } = useVideoCache();
  
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

  // Tracking the previous message type for state transitions
  const [prevMessageType, setPrevMessageType] = useState<string | null>(null);
  // Flag to track if we need to force refresh camera on next tab switch
  const [needsCameraRefresh, setNeedsCameraRefresh] = useState(false);
  
  // Log state changes for debugging
  useEffect(() => {
    if (prevMessageType !== messageType) {
      console.log(`useMessageTypeManager: Tab changed from ${prevMessageType} to ${messageType}`);
      console.log("useMessageTypeManager: Current video state:", {
        videoUrl: videoUrl ? "present" : "none",
        cachedVideoUrl: cachedVideoUrl ? "present" : "none",
        previewStreamActive: previewStream ? (isStreamActive() ? "active" : "inactive") : "none",
        hasCachedVideo: hasCachedVideo()
      });
      setPrevMessageType(messageType);
    }
  }, [messageType, videoUrl, cachedVideoUrl, hasCachedVideo, previewStream, prevMessageType, isStreamActive]);

  // Extract transcription from the current content
  const getCurrentTranscription = () => {
    if (!content) return null;
    return parseMessageTranscription(content);
  };
  
  // Wrapper functions for message type handling
  const onTextTypeClick = () => {
    console.log("Switching to text mode");
    // Save the current video state and transcription before switching to text
    const currentTranscription = getCurrentTranscription();
    
    if (videoBlob && videoUrl) {
      console.log("Caching video before switching to text mode");
      cacheVideo(videoBlob, videoUrl, currentTranscription);
    }
    
    handleTextTypeClick();
    handleMessageTypeChange("text");
    setContextMessageType("text");
    
    // If we were in video mode, clean up the camera stream
    if (previewStream) {
      console.log("Stopping media stream when switching to text");
      stopMediaStream();
    }
    
    // Set flag to refresh camera next time we switch to video
    setNeedsCameraRefresh(true);
  };
  
  // When switching to video type, initialize the camera stream or restore video
  const onVideoTypeClick = async () => {
    console.log("Switching to video mode");
    handleMediaTypeClick();
    handleMessageTypeChange("video");
    setContextMessageType("video");
    
    // If we have cached video, restore it first
    if (cachedVideoBlob && cachedVideoUrl) {
      console.log("Restoring cached video after switching to video mode");
      console.log("Cached transcription:", cachedTranscription);
      await restoreVideo(cachedVideoBlob, cachedVideoUrl, cachedTranscription);
      return;
    }
    
    // Check if we need to force-refresh the camera
    if (needsCameraRefresh || !previewStream || !isStreamActive()) {
      console.log("Video tab needs camera refresh, initializing...");
      // Try to initialize the camera with force=true to ensure fresh stream
      forceInitializeCamera().then(() => {
        setNeedsCameraRefresh(false);
        console.log("Camera successfully refreshed");
      }).catch(err => {
        console.error("Failed to refresh camera:", err);
      });
    } else {
      console.log("Video mode: Camera already active, no need to reinitialize");
    }
  };

  // Effect to clean up video resources when component unmounts
  useEffect(() => {
    return () => {
      if (previewStream) {
        clearVideo();
        stopMediaStream();
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
    clearVideo,
    forceInitializeCamera
  };
}
