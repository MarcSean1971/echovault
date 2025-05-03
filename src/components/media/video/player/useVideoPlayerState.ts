
import { useState, useRef, useEffect } from "react";

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
    
    const setVideoData = () => {
      setDuration(video.duration);
    };
    
    const setVideoTime = () => {
      setCurrentTime(video.currentTime);
    };
    
    // Events
    video.addEventListener('loadeddata', setVideoData);
    video.addEventListener('timeupdate', setVideoTime);
    video.addEventListener('ended', () => setIsPlaying(false));
    
    // Add fullscreen change event listener
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === videoContainerRef.current
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      video.removeEventListener('loadeddata', setVideoData);
      video.removeEventListener('timeupdate', setVideoTime);
      video.removeEventListener('ended', () => setIsPlaying(false));
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Toggle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle time change on slider
  const handleTimeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    const videoContainer = videoContainerRef.current;
    if (!videoContainer) return;
    
    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // Show controls when mouse moves over video
  const handleMouseMove = () => {
    setShowControls(true);
    
    // Reset the timer
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    
    // Hide controls after 3 seconds of inactivity
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };
  
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
