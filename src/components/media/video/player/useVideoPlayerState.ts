
import { useState, useRef, useEffect, useCallback } from "react";

export function useVideoPlayerState() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Handle video events
    const onLoadedData = () => setDuration(video.duration);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onEnded = () => setIsPlaying(false);
    
    // Set up event listeners
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    
    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === videoContainerRef.current);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Clean up event listeners
    return () => {
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, []);
  
  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(err => console.error('Error playing video:', err));
    }
    
    setIsPlaying(!isPlaying);
  }, [isPlaying]);
  
  // Handle time change on slider
  const handleTimeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);
  
  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    const videoContainer = videoContainerRef.current;
    if (!videoContainer) return;
    
    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error('Error attempting to exit fullscreen:', err);
        });
      }
    }
  }, [isFullscreen]);
  
  // Show controls when mouse moves over video
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    // Reset the timer
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    
    // Hide controls after 3 seconds of inactivity if video is playing
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);
  
  return {
    isPlaying,
    isFullscreen,
    duration,
    currentTime,
    showControls,
    videoRef,
    videoContainerRef,
    togglePlay,
    handleTimeChange,
    toggleFullscreen,
    handleMouseMove
  };
}
