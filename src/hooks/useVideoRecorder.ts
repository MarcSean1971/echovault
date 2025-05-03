
import { useRef, useState, useEffect, useCallback } from "react";
import { blobToBase64 } from "@/utils/audioUtils";
import { useMediaStream } from "./useMediaStream";
import { useRecording } from "./useRecording";
import { usePlayback } from "./usePlayback";
import { toast } from "@/components/ui/use-toast";

interface UseVideoRecorderOptions {
  onRecordingComplete?: (blob: Blob, videoURL: string) => void;
  autoInitialize?: boolean; // Add option to control automatic initialization
}

export function useVideoRecorder(options?: UseVideoRecorderOptions) {
  const autoInitialize = options?.autoInitialize ?? false; // Default to false for explicit permission request
  
  // References to video elements
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // State to track readiness
  const [streamReady, setStreamReady] = useState(false);
  
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
    autoInitialize, // Pass through the auto-initialize option
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
  } = useRecording(streamReady ? stream : null, {
    timeslice: 1000, // Get data every second
    videoBitsPerSecond: 2500000, // 2.5 Mbps
    audioBitsPerSecond: 128000 // 128 kbps
  });
  
  const {
    isPlaying,
    handleEnded,
    togglePlayback
  } = usePlayback();
  
  // Track stream connection to video element
  useEffect(() => {
    if (stream && videoPreviewRef.current) {
      console.log("Connecting stream to video element");
      
      // Check if stream is already connected to avoid redundant assignments
      const currentStream = videoPreviewRef.current.srcObject as MediaStream | null;
      if (currentStream && currentStream.id === stream.id) {
        console.log("Stream already connected to video element");
        setStreamReady(true);
        return;
      }
      
      videoPreviewRef.current.srcObject = stream;
      
      // Ensure the video element loads the stream
      videoPreviewRef.current.onloadedmetadata = () => {
        console.log("Video element loaded stream metadata");
        if (videoPreviewRef.current) {
          videoPreviewRef.current.play()
            .then(() => {
              console.log("Video preview playing successfully");
              setStreamReady(true);
            })
            .catch(err => {
              console.error("Error playing stream in video element:", err);
              setStreamReady(false);
              // Try to recover by reinitializing
              resetStream();
            });
        }
      };
    } else {
      setStreamReady(false);
    }
  }, [stream, resetStream]);
  
  // Function to initialize the stream (new explicit initialization method)
  const initializeStream = useCallback(async () => {
    console.log("Explicitly initializing media stream");
    try {
      toast({
        title: "Connecting to camera",
        description: "Please allow camera access if prompted",
      });
      
      const newStream = await initStream();
      if (!newStream) {
        throw new Error("Failed to initialize stream");
      }
      
      return true;
    } catch (err) {
      console.error("Failed to initialize stream:", err);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions and try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [initStream]);
  
  // Function to reinitialize the stream if needed
  const reinitializeStream = useCallback(async () => {
    console.log("Reinitializing media stream");
    setStreamReady(false);
    resetStream(); // This will stop the current stream
    
    return initializeStream();
  }, [initializeStream, resetStream]);
  
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
  
  // Start recording with checks
  const safeStartRecording = useCallback(() => {
    if (!streamReady) {
      console.log("Stream not ready, cannot start recording");
      toast({
        title: "Camera not ready",
        description: "Please wait for camera to initialize or try again.",
        variant: "destructive"
      });
      initializeStream();
      return;
    }
    
    if (!stream) {
      console.log("No stream available, cannot start recording");
      toast({
        title: "No camera available",
        description: "Camera access is required for recording.",
        variant: "destructive"
      });
      initializeStream();
      return;
    }
    
    console.log("Starting recording with stream:", stream.id);
    startRecording();
  }, [stream, streamReady, startRecording, initializeStream]);
  
  // Reset recording state and prepare for new recording
  const reset = useCallback(() => {
    console.log("Resetting video recorder");
    resetRecording();
    
    // Reinitialize the stream if it was stopped
    if (!stream) {
      initializeStream();
    }
  }, [resetRecording, stream, initializeStream]);
  
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
    initializeStream, // Expose the explicit initialization method
  };
}
