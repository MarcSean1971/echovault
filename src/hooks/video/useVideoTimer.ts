
import { useRef, useCallback } from "react";

export function useVideoTimer(
  setRecordingDuration: React.Dispatch<React.SetStateAction<number>>
) {
  const timerRef = useRef<number | null>(null);
  
  const startTimer = useCallback(() => {
    console.log("Starting video timer");
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Set an interval to update the recording duration
    timerRef.current = window.setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    
    console.log("Video timer started:", timerRef.current);
  }, [setRecordingDuration]);
  
  const stopTimer = useCallback(() => {
    console.log("Stopping video timer, ref:", timerRef.current);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Video timer stopped");
    }
  }, []);
  
  // Clean up the timer when the component unmounts
  const cleanupTimer = useCallback(() => {
    stopTimer();
  }, [stopTimer]);
  
  return { startTimer, stopTimer, cleanupTimer };
}
