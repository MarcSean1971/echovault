
import { useState, useRef, useCallback, useEffect } from "react";

interface UseVideoPlayerProps {
  videoUrl: string | null;
  onError?: (error: string) => void;
}

export function useVideoPlayer({ videoUrl, onError }: UseVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Toggle video playback
  const togglePlayback = useCallback(() => {
    if (!videoRef.current) {
      console.error("Video element reference is null");
      return;
    }
    
    console.log("Toggle playback called, current state:", isPlaying);
    
    if (isPlaying) {
      console.log("Pausing video");
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      console.log("Playing video");
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
        if (onError) {
          onError("Error playing video: " + (err.message || "Unknown error"));
        }
      });
      setIsPlaying(true);
    }
  }, [isPlaying, onError]);
  
  // Handle video ended event
  const handleVideoEnded = useCallback(() => {
    console.log("Video playback ended");
    setIsPlaying(false);
  }, []);
  
  // Handle video loaded event
  const handleVideoLoaded = useCallback(() => {
    console.log("Video loaded and ready to play");
  }, []);
  
  // Handle video error event
  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video error:", e);
    if (onError) {
      onError("Error loading video");
    }
  }, [onError]);
  
  // Reset playing state when URL changes
  useEffect(() => {
    setIsPlaying(false);
  }, [videoUrl]);
  
  return {
    videoRef,
    isPlaying,
    setIsPlaying,
    togglePlayback,
    handleVideoEnded,
    handleVideoLoaded,
    handleVideoError
  };
}
