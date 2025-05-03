
import { useRef, useState, useEffect, useCallback } from "react";
import { blobToBase64 } from "@/utils/audioUtils";
import { toast } from "@/components/ui/use-toast";
import { VideoRecorderHookResult, VideoRecordingOptions } from "./types";
import { useMediaStream } from "./useMediaStream";
import { useRecording } from "./useRecording";
import { usePlayback } from "./usePlayback";

interface UseVideoRecorderOptions {
  onRecordingComplete?: (blob: Blob, videoURL: string) => void;
  autoInitialize?: boolean;
}

export function useVideoRecorder(options?: UseVideoRecorderOptions): VideoRecorderHookResult {
  const autoInitialize = options?.autoInitialize ?? false;
  
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
    autoInitialize,
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
    timeslice: 1000,
    videoBitsPerSecond: 2500000,
    audioBitsPerSecond: 128000
  });
  
  const {
    isPlaying,
    handleEnded,
    togglePlayback
  } = usePlayback();
  
  // Improved stream connection to video element with better readiness detection
  useEffect(() => {
    if (stream && videoPreviewRef.current) {
      console.log("Connecting stream to video element");
      
      // Set stream to video element
      videoPreviewRef.current.srcObject = stream;
      
      // Create a more reliable way to check readiness
      const checkStreamActive = () => {
        if (!videoPreviewRef.current) return;
        
        const videoElem = videoPreviewRef.current;
        
        // Multiple checks to confirm stream is truly ready
        const isVideoPlaying = 
          !videoElem.paused && 
          !videoElem.ended && 
          videoElem.currentTime > 0 &&
          videoElem.readyState >= 2; // HAVE_CURRENT_DATA or better
          
        const hasActiveStream = 
          videoElem.srcObject instanceof MediaStream && 
          (videoElem.srcObject as MediaStream).active &&
          (videoElem.srcObject as MediaStream).getVideoTracks().length > 0 &&
          (videoElem.srcObject as MediaStream).getVideoTracks()[0].readyState === 'live';
        
        const isReady = isVideoPlaying && hasActiveStream;
        console.log("Stream active check:", isReady, "Video playing:", isVideoPlaying, "Has active stream:", hasActiveStream);
        
        if (isReady) {
          setStreamReady(true);
        }
      };
      
      // Check immediately and also set up event listeners
      videoPreviewRef.current.onloadedmetadata = () => {
        console.log("Video element loaded stream metadata");
        if (videoPreviewRef.current) {
          videoPreviewRef.current.play()
            .then(() => {
              console.log("Video preview playing successfully");
              // Use a short delay to let the video truly start playing
              setTimeout(checkStreamActive, 100);
              setTimeout(checkStreamActive, 500);
              setTimeout(checkStreamActive, 1000);
            })
            .catch(err => {
              console.error("Error playing stream in video element:", err);
              setStreamReady(false);
            });
        }
      };
      
      // Additional event listeners to check stream readiness
      videoPreviewRef.current.addEventListener('playing', checkStreamActive);
      videoPreviewRef.current.addEventListener('timeupdate', checkStreamActive);
      
      // Clean up
      return () => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.removeEventListener('playing', checkStreamActive);
          videoPreviewRef.current.removeEventListener('timeupdate', checkStreamActive);
        }
      };
    } else {
      setStreamReady(false);
    }
  }, [stream]);
  
  // Function to initialize the stream with better error handling
  const initializeStream = useCallback(async () => {
    console.log("Explicitly initializing media stream");
    try {
      toast({
        title: "Connecting to camera",
        description: "Please allow camera access if prompted",
      });
      
      const newStream = await initStream();
      
      // Give the stream time to properly initialize before concluding
      if (newStream) {
        console.log("Stream initialized, waiting for video element to connect");
        return true;
      } else {
        throw new Error("Failed to initialize stream");
      }
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
    resetStream();
    
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
  
  // Start recording with better checks and feedback
  const safeStartRecording = useCallback(() => {
    if (!streamReady) {
      console.log("Stream not ready, cannot start recording");
      toast({
        title: "Camera not ready",
        description: "Please wait for camera to initialize or try again.",
        variant: "destructive"
      });
      
      // Try to reinitialize if needed
      if (!stream || !streamReady) {
        initializeStream();
      }
      return;
    }
    
    console.log("Starting recording with stream:", stream?.id);
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
    initializeStream,
  };
}
