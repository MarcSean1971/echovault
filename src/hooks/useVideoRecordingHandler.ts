
import { useState, useRef, useCallback, useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { safeCreateObjectURL, safeRevokeObjectURL } from "@/utils/mediaUtils";
import { useMediaStream } from "./video/useMediaStream";
import { useVideoRecorder } from "./video/useVideoRecorder";
import { useVideoStorage } from "./video/useVideoStorage";

export function useVideoRecordingHandler() {
  const { setVideoContent } = useMessageForm();
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isInitializationAttempted, setIsInitializationAttempted] = useState(false);
  
  // Use our modular hooks
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
    startRecording: startRecordingInner,
    stopRecording,
    setVideoBlob: setVideoBlobInner,
    setVideoUrl: setVideoUrlInner
  } = useVideoRecorder(previewStream, streamRef);
  
  const {
    showVideoRecorder,
    setShowVideoRecorder,
    clearVideo: clearVideoInner,
    restoreVideo: restoreVideoInner
  } = useVideoStorage();
  
  // Initialize media stream
  const initializeStreamWithSetup = useCallback(async () => {
    try {
      setIsInitializationAttempted(true);
      return await initializeStream();
    } catch (error: any) {
      console.error("Error initializing media stream:", error);
      throw error;
    }
  }, [initializeStream]);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    if (videoUrl) {
      safeRevokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    
    stopMediaStream();
    setVideoBlobInner(null);
    setVideoUrlInner(null);
  }, [videoUrl, stopMediaStream, setVideoBlobInner, setVideoUrlInner]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  // Force initialize camera - returns Promise<boolean> internally but we adapt the signature as needed
  const forceInitializeCamera = useCallback(async (): Promise<boolean> => {
    try {
      setIsInitializationAttempted(true);
      
      // Stop any existing stream first
      if (isStreamActive()) {
        stopMediaStream();
      }
      
      // Request a new stream with both video and audio
      const stream = await initializeStream(true);
      console.log("Force initialize camera successful", !!stream);
      return !!stream;
    } catch (error: any) {
      console.error("Force initialize camera failed:", error);
      return false;
    }
  }, [initializeStream, stopMediaStream, isStreamActive]);
  
  // Start recording wrapper to handle form state - explicitly returns Promise<boolean>
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      await startRecordingInner();
      return true;
    } catch (error) {
      console.error("Error in startRecording wrapper:", error);
      throw error;
    }
  }, [startRecordingInner]);
  
  // Clear video wrapper
  const clearVideo = useCallback(() => {
    clearVideoInner(videoUrl, setVideoBlob, setVideoUrl);
    setVideoContent('');
  }, [videoUrl, setVideoContent, clearVideoInner]);
  
  // Restore video wrapper with improved handling
  const restoreVideo = useCallback((blob: Blob, url: string) => {
    console.log("restoreVideo called with blob size:", blob.size, "and url:", url.substring(0, 30) + "...");
    
    restoreVideoInner(blob, url, setVideoBlob, setVideoUrl);
    
    // Convert blob back to base64 and update video content
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result?.toString().split(',')[1] || '';
      const formattedContent = JSON.stringify({
        videoData: base64data,
        timestamp: new Date().toISOString()
      });
      console.log("Restoring video content in form state");
      setVideoContent(formattedContent);
    };
  }, [restoreVideoInner, setVideoContent]);
  
  return {
    isRecording,
    isInitializing,
    hasPermission,
    videoBlob,
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    previewStream,
    initializeStream: initializeStreamWithSetup,
    forceInitializeCamera,
    startRecording,
    stopRecording,
    clearVideo,
    restoreVideo,
    stopMediaStream,
    isStreamActive,
    isInitializationAttempted
  };
}
