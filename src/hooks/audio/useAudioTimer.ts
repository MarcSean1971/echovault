
import { useRef, useCallback } from "react";

export function useAudioTimer(
  setRecordingDuration: React.Dispatch<React.SetStateAction<number>>
) {
  const timerRef = useRef<number | null>(null);
  
  const startTimer = useCallback(() => {
    console.log("Starting timer");
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Set an interval to update the recording duration
    timerRef.current = window.setInterval(() => {
      setRecordingDuration(prev => prev + 1);
      console.log("Timer tick");
    }, 1000);
    
    console.log("Timer started:", timerRef.current);
  }, [setRecordingDuration]);
  
  const stopTimer = useCallback(() => {
    console.log("Stopping timer, ref:", timerRef.current);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Timer stopped");
    }
  }, []);
  
  // Clean up the timer when the component unmounts
  const cleanupTimer = useCallback(() => {
    stopTimer();
  }, [stopTimer]);
  
  return { startTimer, stopTimer, cleanupTimer };
}
