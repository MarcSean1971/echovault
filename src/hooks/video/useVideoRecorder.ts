
import { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { VideoRecorderHookResult, VideoRecordingOptions } from "./types";
import { useMediaStream } from "./useMediaStream";
import { useRecording } from "./useRecording";
import { usePlayback } from "./usePlayback";
import { useVideoStreamHandling } from "./useVideoStreamHandling";
import { useVideoInitialization } from "./useVideoInitialization";
import { useVideoRecordingControls } from "./useVideoRecordingControls";

interface UseVideoRecorderOptions {
  onRecordingComplete?: (blob: Blob, videoURL: string) => void;
  autoInitialize?: boolean;
}

export function useVideoRecorder(options?: UseVideoRecorderOptions): VideoRecorderHookResult {
  const autoInitialize = options?.autoInitialize ?? false;
  
  // References to video elements
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Use our utility hooks
  const { 
    stream, 
    isBrowserSupported,
    isInitializing,
    permissionDenied,
    stopStream,
    initStream,
    resetStream
  } = useMediaStream({ 
    audio: true, 
    video: true,
    videoConstraints: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    },
    autoInitialize,
  });
  
  // Stream handling
  const { streamReady } = useVideoStreamHandling({
    videoPreviewRef,
    stream
  });
  
  // Stream initialization
  const { initializeStream, reinitializeStream } = useVideoInitialization({
    initStream,
    resetStream,
    stream
  });
  
  // Recording functionality
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
  } = useRecording(streamReady ? stream : null, {
    timeslice: 1000,
    videoBitsPerSecond: 2500000,
    audioBitsPerSecond: 128000
  });
  
  // Playback controls
  const {
    isPlaying,
    handleEnded,
    togglePlayback
  } = usePlayback();
  
  // Recording controls
  const { 
    startRecording: safeStartRecording, 
    reset, 
    handleAccept 
  } = useVideoRecordingControls({
    streamReady,
    stream,
    startRecording,
    resetRecording,
    videoBlob,
    stopStream,
    initializeStream,
    onRecordingComplete: options?.onRecordingComplete
  });
  
  // Cleanup resources on unmount
  useEffect(() => {
    return () => {
      console.log("VideoRecorder unmounting, cleaning up resources");
      cleanupRecording();
      stopStream();
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
      }
    };
  }, [cleanupRecording, stopStream, videoURL]);
  
  // Handle playback toggle
  const handleTogglePlayback = useCallback(() => {
    togglePlayback(recordedVideoRef.current);
  }, [togglePlayback]);

  return {
    // State
    isRecording,
    isPaused,
    isPlaying,
    recordingDuration,
    videoURL,
    videoBlob,
    isBrowserSupported,
    isInitializing,
    streamReady,
    stream,
    permissionDenied,
    
    // Refs
    videoPreviewRef,
    recordedVideoRef,
    
    // Methods
    startRecording: safeStartRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePlayback: handleTogglePlayback,
    handleVideoEnded: handleEnded,
    reset,
    handleAccept,
    reinitializeStream,
    initializeStream,
  };
}
