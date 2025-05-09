
import { useState, useRef, useCallback } from "react";

export function useVideoTimer() {
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<number | null>(null);
  
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = window.setInterval(() => {
      setRecordingDuration(prevDuration => prevDuration + 1);
    }, 1000);
  }, []);
  
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  const resetTimer = useCallback(() => {
    stopTimer();
    setRecordingDuration(0);
  }, [stopTimer]);
  
  const cleanupTimer = useCallback(() => {
    stopTimer();
  }, [stopTimer]);
  
  return {
    recordingDuration,
    startTimer,
    stopTimer,
    resetTimer,
    cleanupTimer
  };
}
