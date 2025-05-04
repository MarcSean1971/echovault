
import { useState, useRef, useCallback } from "react";

export function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);
  
  return {
    isPlaying,
    audioRef,
    togglePlayback,
    handleAudioEnded
  };
}
