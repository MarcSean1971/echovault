
import { useCallback } from "react";
import { stopMediaTracks } from "./audioUtils";

interface RecordingHandlersParams {
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  setIsRecording: (isRecording: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  startTimer: () => void;
  stopTimer: () => void;
}

/**
 * Provides handlers for controlling audio recording (pause, resume, stop)
 */
export function useRecordingHandlers({
  mediaRecorderRef,
  streamRef,
  setIsRecording,
  setIsPaused,
  startTimer,
  stopTimer
}: RecordingHandlersParams) {
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("Pausing recording");
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        
        // Pause the timer
        stopTimer();
      } catch (err) {
        console.error("Error pausing recording:", err);
      }
    }
  }, [mediaRecorderRef, setIsPaused, stopTimer]);
  
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      console.log("Resuming recording");
      try {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        
        // Resume the timer
        startTimer();
      } catch (err) {
        console.error("Error resuming recording:", err);
      }
    }
  }, [mediaRecorderRef, setIsPaused, startTimer]);
  
  const stopRecording = useCallback(() => {
    console.log("Stopping recording, current state:", mediaRecorderRef.current?.state);
    
    // Stop the timer first
    stopTimer();
    
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused") {
          mediaRecorderRef.current.stop();
          console.log("MediaRecorder stopped");
        }
        
        setIsRecording(false);
        setIsPaused(false);
      } catch (err) {
        console.error("Error stopping recording:", err);
      }
    }
    
    // Ensure we clean up the stream
    stopMediaTracks(streamRef.current);
    streamRef.current = null;
  }, [mediaRecorderRef, streamRef, setIsRecording, setIsPaused, stopTimer]);
  
  return {
    pauseRecording,
    resumeRecording,
    stopRecording
  };
}
