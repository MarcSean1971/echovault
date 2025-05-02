
import { useState, useCallback } from "react";

export function usePlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);
  
  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  const togglePlayback = useCallback((videoElement: HTMLVideoElement | null) => {
    if (!videoElement) return;
    
    if (isPlaying) {
      videoElement.pause();
      setIsPlaying(false);
    } else {
      videoElement.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return {
    isPlaying,
    handlePlay,
    handlePause,
    handleEnded,
    togglePlayback
  };
}
