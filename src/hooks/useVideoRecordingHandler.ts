
import { useState } from "react";
import { useMediaStream } from "./video/useMediaStream";
import { useVideoRecorder } from "./video/useVideoRecorder";
import { useVideoStorage } from "./video/useVideoStorage";
import { useMessageForm } from "@/components/message/MessageFormContext";

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
  
  // Wrapper function for restoreVideo
  const restoreVideo = async (blob: Blob, url: string) => {
    console.log("useVideoRecordingHandler: Restoring video", { 
      hasBlob: !!blob, 
      hasUrl: !!url, 
      blobSize: blob?.size || 0
    });
    
    restoreVideoBase(blob, url, setVideoBlob, setVideoUrl);
    
    // If we have a blob, restore it in the content
    if (blob) {
      try {
        // Format the video content for the form
        const formattedContent = await formatVideoContent(blob);
        setVideoContent(formattedContent);
        setContent(formattedContent);
      } catch (err) {
        console.error("Error restoring video content:", err);
      }
    }
  };

  // Format video content (simplified without transcription)
  const formatVideoContent = async (blob: Blob): Promise<string> => {
    const base64 = await blobToBase64(blob);
    return JSON.stringify({
      videoData: base64,
      timestamp: new Date().toISOString()
    });
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
