
import { useState, useRef, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { getOptimalMimeType, stopMediaTracks } from "./audioUtils";
import { useAudioTimer } from "./useAudioTimer";

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { startTimer, stopTimer, cleanupTimer } = useAudioTimer(setRecordingDuration);
  
  const processRecordingComplete = useCallback((options?: { onRecordingComplete?: (blob: Blob, audioURL: string) => void }) => {
    if (audioChunksRef.current.length === 0) {
      console.warn("No audio data recorded");
      return;
    }
    
    const mimeType = getOptimalMimeType();
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    console.log("Audio blob created:", audioBlob.size);
    
    const url = URL.createObjectURL(audioBlob);
    setAudioURL(url);
    setAudioBlob(audioBlob);
    
    // Notify about recording completion if callback provided
    if (options?.onRecordingComplete) {
      options.onRecordingComplete(audioBlob, url);
    }
  }, []);
  
  const startRecording = useCallback(async (options?: { onRecordingComplete?: (blob: Blob, audioURL: string) => void }) => {
    // Reset state before starting
    audioChunksRef.current = [];
    setRecordingDuration(0);
    setPermissionDenied(false);
    
    // Stop any existing timer
    stopTimer();
    
    console.log("Starting audio recording...");
    
    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Got audio stream:", stream);
      
      // Save the stream reference for cleanup
      streamRef.current = stream;
      
      // Create new MediaRecorder instance
      const mimeType = getOptimalMimeType();
      console.log("Using MIME type:", mimeType);
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      
      console.log("MediaRecorder created:", mediaRecorderRef.current);
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log("Data available:", event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstart = () => {
        console.log("MediaRecorder started, beginning timer");
        // Start the timer only once the MediaRecorder is actually recording
        startTimer();
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Recording Error",
          description: "An error occurred while recording audio.",
          variant: "destructive"
        });
        stopRecording();
      };
      
      mediaRecorderRef.current.onstop = () => {
        console.log("MediaRecorder stopped, processing chunks:", audioChunksRef.current.length);
        processRecordingComplete(options);
        
        // Close the stream tracks
        stopMediaTracks(streamRef.current);
        streamRef.current = null;
      };
      
      // Start recording and update state
      mediaRecorderRef.current.start();
      console.log("MediaRecorder.start() called");
      
      setIsRecording(true);
      setIsPaused(false);
      
    } catch (err: any) {
      console.error("Error starting recording:", err);
      
      // Check if it's a permission denial
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionDenied(true);
        toast({
          title: "Permission Denied",
          description: "Microphone access was denied. Please grant permission to use the recorder.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Recording Failed",
          description: "Could not start recording: " + (err.message || "Unknown error"),
          variant: "destructive"
        });
      }
    }
  }, [startTimer, stopTimer, processRecordingComplete]);
  
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused && mediaRecorderRef.current.state === "recording") {
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
  }, [isRecording, isPaused, stopTimer]);
  
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused && mediaRecorderRef.current.state === "paused") {
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
  }, [isRecording, isPaused, startTimer]);
  
  const stopRecording = useCallback(() => {
    console.log("Stopping recording, current state:", mediaRecorderRef.current?.state);
    
    // Stop the timer first
    stopTimer();
    
    if (mediaRecorderRef.current && isRecording) {
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
  }, [isRecording, stopTimer]);
  
  const cleanupRecording = useCallback(() => {
    stopRecording();
    cleanupTimer();
    
    // Close any open media streams
    stopMediaTracks(streamRef.current);
    streamRef.current = null;
  }, [stopRecording, cleanupTimer]);
  
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
