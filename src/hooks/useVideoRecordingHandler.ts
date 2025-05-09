
import { useState } from "react";
import { useMediaStream } from "./video/useMediaStream";
import { useVideoRecorder } from "./video/useVideoRecorder";
import { useVideoStorage } from "./video/useVideoStorage";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { formatVideoContent } from "@/services/messages/transcriptionService";

export function useVideoRecordingHandler() {
  const { setContent } = useMessageForm();
  // Use our custom hooks
  const {
    previewStream,
    isInitializing,
    hasPermission,
    streamRef,
    initializeStream,
    stopMediaStream
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
    clearVideoBase(videoUrl, setVideoBlob, setVideoUrl);
  };
  
  // Wrapper function for restoreVideo with transcription support
  const restoreVideo = async (blob: Blob, url: string, transcription: string | null = null) => {
    restoreVideoBase(blob, url, setVideoBlob, setVideoUrl);
    
    // If we have a transcription, restore it in the content
    if (transcription && blob) {
      try {
        console.log("Restoring video with transcription:", transcription.substring(0, 30) + "...");
        // Format the content with video data and transcription to update the form
        const formattedContent = await formatVideoContent(blob, transcription);
        setContent(formattedContent);
      } catch (err) {
        console.error("Error restoring video transcription:", err);
      }
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
    startRecording,
    stopRecording,
    clearVideo,
    restoreVideo
  };
}
