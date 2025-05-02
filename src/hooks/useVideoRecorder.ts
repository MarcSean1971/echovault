
import { useRef, useEffect, useCallback } from "react";
import { blobToBase64 } from "@/utils/audioUtils";
import { useMediaStream } from "./useMediaStream";
import { useRecording } from "./useRecording";
import { usePlayback } from "./usePlayback";

interface UseVideoRecorderOptions {
  onRecordingComplete?: (blob: Blob, videoURL: string) => void;
}

export function useVideoRecorder(options?: UseVideoRecorderOptions) {
  // References to video elements
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Use our utility hooks
  const { 
    stream, 
    isBrowserSupported,
    stopStream 
  } = useMediaStream({ audio: true, video: true });
  
  const {
    isRecording,
    isPaused,
    recordingDuration,
    recordedBlob: videoBlob,
    recordedUrl: videoURL,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    cleanup: cleanupRecording
  } = useRecording(stream);
  
  const {
    isPlaying,
    handleEnded,
    togglePlayback
  } = usePlayback();
  
  // Connect video preview to stream
  useEffect(() => {
    if (videoPreviewRef.current && stream) {
      videoPreviewRef.current.srcObject = stream;
    }
  }, [stream, videoPreviewRef]);
  
  // Cleanup resources on unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
      }
    };
  }, [cleanupRecording, videoURL]);
  
  // Handle playback toggle
  const handleTogglePlayback = useCallback(() => {
    togglePlayback(recordedVideoRef.current);
  }, [togglePlayback]);
  
  // Reset recording state and prepare for new recording
  const reset = useCallback(() => {
    resetRecording();
  }, [resetRecording]);
  
  // Process and accept the recorded video
  const handleAccept = useCallback(async () => {
    if (!videoBlob) return null;
    
    try {
      // Revoke camera access when accepting the video
      stopStream();
      
      const base64Video = await blobToBase64(videoBlob);
      
      // Notify about recording completion if callback provided
      if (options?.onRecordingComplete) {
        options.onRecordingComplete(videoBlob, base64Video);
      }
      
      return { videoBlob, base64Video };
    } catch (err) {
      console.error("Error processing video:", err);
      return null;
    }
  }, [videoBlob, stopStream, options]);
  
  return {
    // State
    isRecording,
    isPaused,
    isPlaying,
    recordingDuration,
    videoURL,
    videoBlob,
    isBrowserSupported,
    stream,
    
    // Refs
    videoPreviewRef,
    recordedVideoRef,
    
    // Methods
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePlayback: handleTogglePlayback,
    handleVideoEnded: handleEnded,
    reset,
    handleAccept
  };
}
