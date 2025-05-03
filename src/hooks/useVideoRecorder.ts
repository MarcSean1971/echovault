
import { useRef, useState, useEffect, useCallback } from "react";
import { blobToBase64 } from "@/utils/audioUtils";
import { useMediaStream } from "./useMediaStream";
import { useRecording } from "./useRecording";
import { usePlayback } from "./usePlayback";
import { toast } from "@/components/ui/use-toast";

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
    isInitializing,
    stopStream,
    initStream
  } = useMediaStream({ 
    audio: true, 
    video: true,
    videoConstraints: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    }
  });
  
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
  } = useRecording(stream, {
    timeslice: 1000, // Get data every second
    videoBitsPerSecond: 2500000, // 2.5 Mbps
    audioBitsPerSecond: 128000 // 128 kbps
  });
  
  const {
    isPlaying,
    handleEnded,
    togglePlayback
  } = usePlayback();
  
  // Function to reinitialize the stream if needed
  const reinitializeStream = useCallback(async () => {
    console.log("Reinitializing media stream");
    try {
      const newStream = await initStream();
      if (newStream && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = newStream;
        console.log("Stream reinitialized and connected to video element");
      }
    } catch (err) {
      console.error("Failed to reinitialize stream:", err);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions and try again.",
        variant: "destructive"
      });
    }
  }, [initStream]);
  
  // Connect video preview to stream
  useEffect(() => {
    if (videoPreviewRef.current && stream) {
      console.log("Connecting stream to video element");
      videoPreviewRef.current.srcObject = stream;
      
      // Ensure the video element loads the stream
      videoPreviewRef.current.onloadedmetadata = () => {
        console.log("Video element loaded stream metadata");
        if (videoPreviewRef.current) {
          videoPreviewRef.current.play().catch(err => {
            console.error("Error playing stream in video element:", err);
          });
        }
      };
    }
  }, [stream, videoPreviewRef]);
  
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
  
  // Reset recording state and prepare for new recording
  const reset = useCallback(() => {
    console.log("Resetting video recorder");
    resetRecording();
    
    // Reinitialize the stream if it was stopped
    if (!stream) {
      reinitializeStream();
    }
  }, [resetRecording, stream, reinitializeStream]);
  
  // Process and accept the recorded video
  const handleAccept = useCallback(async () => {
    if (!videoBlob) {
      console.log("No video blob available");
      return null;
    }
    
    console.log(`Processing video blob (size: ${videoBlob.size}, type: ${videoBlob.type})`);
    
    try {
      // Revoke camera access when accepting the video
      stopStream();
      
      const base64Video = await blobToBase64(videoBlob);
      console.log("Video converted to base64 successfully");
      
      // Notify about recording completion if callback provided
      if (options?.onRecordingComplete) {
        options.onRecordingComplete(videoBlob, base64Video);
      }
      
      return { videoBlob, base64Video };
    } catch (err) {
      console.error("Error processing video:", err);
      toast({
        title: "Processing Error",
        description: "Failed to process the recorded video.",
        variant: "destructive"
      });
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
    isInitializing,
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
    handleAccept,
    reinitializeStream
  };
}
