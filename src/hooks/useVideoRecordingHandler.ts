
import { useState } from "react";
import { useMediaStream } from "./video/useMediaStream";
import { useVideoRecorder } from "./video/useVideoRecorder";
import { useVideoStorage } from "./video/useVideoStorage";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { formatVideoContent } from "@/services/messages/transcriptionService";

export function useVideoRecordingHandler() {
  const { setContent, setVideoContent } = useMessageForm();
  // Use our custom hooks
  const {
    previewStream,
    isInitializing,
    hasPermission,
    streamRef,
    initializeStream,
    stopMediaStream,
    isStreamActive
  } = useMediaStream();
  
  const {
    isRecording,
    videoBlob,
    videoUrl,
    startRecording,
    stopRecording,
    setVideoBlob,
    setVideoUrl
  } = useVideoRecorder(previewStream, streamRef);
  
  const {
    showVideoRecorder,
    setShowVideoRecorder,
    clearVideo: clearVideoBase,
    restoreVideo: restoreVideoBase
  } = useVideoStorage();
  
  // Wrapper function for clearVideo
  const clearVideo = () => {
    console.log("useVideoRecordingHandler: Clearing video");
    clearVideoBase(videoUrl, setVideoBlob, setVideoUrl);
    
    // Clear the videoContent in the form context
    setVideoContent("");
  };
  
  // Wrapper function for restoreVideo with transcription support
  const restoreVideo = async (blob: Blob, url: string, transcription: string | null = null) => {
    console.log("useVideoRecordingHandler: Restoring video", { 
      hasBlob: !!blob, 
      hasUrl: !!url, 
      hasTranscription: !!transcription,
      blobSize: blob?.size || 0
    });
    
    restoreVideoBase(blob, url, setVideoBlob, setVideoUrl);
    
    // If we have a transcription, restore it in the content
    if (blob) {
      try {
        console.log("Restoring video with transcription:", transcription ? transcription.substring(0, 30) + "..." : "none");
        // Format the content with video data and transcription to update the form
        const formattedContent = await formatVideoContent(blob, transcription);
        setVideoContent(formattedContent);
        setContent(formattedContent);
      } catch (err) {
        console.error("Error restoring video content:", err);
      }
    }
  };
  
  // Force initialize camera - used when switching tabs or when camera needs refresh
  const forceInitializeCamera = async () => {
    try {
      console.log("Forcing camera initialization...");
      await initializeStream(true);
      console.log("Force camera initialization successful");
      return true;
    } catch (error) {
      console.error("Force camera initialization failed:", error);
      return false;
    }
  };
  
  return {
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
  };
}
