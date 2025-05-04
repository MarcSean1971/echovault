
import { useCallback } from "react";
import { useAudioRecordingState } from "./useAudioRecordingState";
import { useMediaStream } from "./useMediaStream";
import { useRecordingHandlers } from "./useRecordingHandlers";
import { setupMediaRecorder } from "./useMediaRecorderSetup";
import { useAudioTimer } from "./useAudioTimer";
import { stopMediaTracks } from "./audioUtils";

export interface RecordingCompleteOptions {
  onRecordingComplete?: (blob: Blob, audioURL: string) => void;
}

export function useAudioRecording() {
  // Initialize state and refs
  const {
    isRecording,
    setIsRecording,
    isPaused,
    setIsPaused,
    recordingDuration,
    setRecordingDuration,
    audioURL,
    setAudioURL,
    audioBlob,
    setAudioBlob,
    permissionDenied,
    setPermissionDenied,
    mediaRecorderRef,
    audioChunksRef,
    streamRef
  } = useAudioRecordingState();
  
  // Initialize audio timer
  const { startTimer, stopTimer, cleanupTimer } = useAudioTimer(setRecordingDuration);
  
  // Initialize media stream handlers
  const { requestMediaStream, closeMediaStream } = useMediaStream();
  
  // Process recording data into a blob when recording completes
  const processRecordingComplete = useCallback((options?: RecordingCompleteOptions) => {
    if (audioChunksRef.current.length === 0) {
      console.warn("No audio data recorded");
      return;
    }
    
    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    console.log("Audio blob created:", audioBlob.size);
    
    const url = URL.createObjectURL(audioBlob);
    setAudioURL(url);
    setAudioBlob(audioBlob);
    
    // Notify about recording completion if callback provided
    if (options?.onRecordingComplete) {
      options.onRecordingComplete(audioBlob, url);
    }
  }, [setAudioURL, setAudioBlob]);
  
  // Initialize recording control handlers
  const { pauseRecording, resumeRecording, stopRecording } = useRecordingHandlers({
    mediaRecorderRef,
    streamRef,
    setIsRecording,
    setIsPaused,
    startTimer,
    stopTimer
  });
  
  // Start recording function
  const startRecording = useCallback(async (options?: RecordingCompleteOptions) => {
    // Reset state before starting
    audioChunksRef.current = [];
    setRecordingDuration(0);
    setPermissionDenied(false);
    
    // Stop any existing timer
    stopTimer();
    
    console.log("Starting audio recording...");
    
    // Request access to the microphone
    const { stream, error } = await requestMediaStream();
    
    if (error === "permission_denied") {
      setPermissionDenied(true);
      return;
    }
    
    if (!stream) {
      return; // Other error was already handled in requestMediaStream
    }
    
    // Save the stream reference for cleanup
    streamRef.current = stream;
    
    // Create and configure the MediaRecorder
    mediaRecorderRef.current = setupMediaRecorder({
      stream,
      onDataAvailable: (event) => {
        console.log("Data available:", event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      },
      onStart: () => {
        console.log("MediaRecorder started, beginning timer");
        // Start the timer only once the MediaRecorder is actually recording
        startTimer();
      },
      onError: () => {
        stopRecording();
      },
      onStop: () => {
        console.log("MediaRecorder stopped, processing chunks:", audioChunksRef.current.length);
        processRecordingComplete(options);
        
        // Close the stream tracks
        stopMediaTracks(streamRef.current);
        streamRef.current = null;
      }
    });
    
    // Start recording with a timeslice of 1000ms (1 second)
    // This ensures ondataavailable is called periodically during recording
    mediaRecorderRef.current.start(1000);
    console.log("MediaRecorder.start(1000) called with timeslice");
    
    setIsRecording(true);
    setIsPaused(false);
  }, [
    setRecordingDuration, 
    stopTimer, 
    requestMediaStream, 
    setPermissionDenied, 
    setIsRecording, 
    setIsPaused, 
    startTimer, 
    stopRecording, 
    processRecordingComplete
  ]);
  
  // Cleanup function for unmounting
  const cleanupRecording = useCallback(() => {
    stopRecording();
    cleanupTimer();
    
    // Close any open media streams
    closeMediaStream(streamRef.current);
    streamRef.current = null;
  }, [stopRecording, cleanupTimer, closeMediaStream]);
  
  // Return the public API
  return {
    isRecording,
    isPaused,
    recordingDuration,
    audioURL,
    audioBlob,
    permissionDenied,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cleanupRecording
  };
}
