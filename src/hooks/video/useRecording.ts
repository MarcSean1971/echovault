
import { useRef, useState, useCallback, useEffect } from "react";
import { getSupportedVideoMimeType } from "./videoUtils";
import { toast } from "@/components/ui/use-toast";
import { MediaRecorderHookResult, RecordingOptions } from "./types";

/**
 * Hook for managing the recording process with MediaRecorder API
 */
export function useRecording(
  stream: MediaStream | null,
  options: RecordingOptions = {}
): MediaRecorderHookResult {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(stream);
  
  // Update stream reference when it changes
  useEffect(() => {
    streamRef.current = stream;
    
    // If the stream changes during recording, we need to stop and restart
    if (isRecording && (!stream || streamRef.current?.id !== stream?.id)) {
      console.log("Stream changed during recording, stopping current recording");
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setIsPaused(false);
    }
  }, [stream, isRecording]);
  
  // Timer functions
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  }, []);
  
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  // Media recorder event handlers
  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      console.log(`Received data chunk of size: ${event.data.size}`);
      chunksRef.current.push(event.data);
    }
  }, []);
  
  const handleRecordingStop = useCallback(() => {
    console.log("Recording stopped, processing chunks...");
    stopTimer();
    setIsRecording(false);
    setIsPaused(false);
    
    if (chunksRef.current.length === 0) {
      console.error("No data chunks recorded");
      toast({
        title: "Recording Error",
        description: "No data was recorded. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const mimeType = options.mimeType || getSupportedVideoMimeType();
      const recordedBlob = new Blob(chunksRef.current, { type: mimeType });
      console.log(`Created blob of size: ${recordedBlob.size}, type: ${recordedBlob.type}`);
      
      if (recordedBlob.size < 100) {
        throw new Error("Recording too small, likely failed");
      }
      
      const url = URL.createObjectURL(recordedBlob);
      
      setRecordedBlob(recordedBlob);
      setRecordedUrl(url);
      
      if (options.onRecordingComplete) {
        options.onRecordingComplete(recordedBlob, url);
      }
    } catch (err) {
      console.error("Error processing recording:", err);
      toast({
        title: "Recording Failed",
        description: "Failed to process the recording. Please try again.",
        variant: "destructive"
      });
    }
  }, [options, stopTimer]);
  
  // Recording control functions
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      console.error("No media stream available for recording");
      toast({
        title: "Recording Error",
        description: "No media stream available for recording",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Reset state
      chunksRef.current = [];
      setRecordingDuration(0);
      
      // Get supported mime type
      const mimeType = options.mimeType || getSupportedVideoMimeType();
      
      console.log("Starting MediaRecorder with options:", {
        mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000, // 2.5 Mbps default
        audioBitsPerSecond: options.audioBitsPerSecond || 128000 // 128 kbps default
      });
      
      // Initialize MediaRecorder with options
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000
      });
      
      // Set up event handlers
      recorder.ondataavailable = handleDataAvailable;
      recorder.onstop = handleRecordingStop;
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Recording Error",
          description: "An error occurred during recording. Please try again.",
          variant: "destructive"
        });
        stopRecording();
      };
      
      // Start recording with timeslice to get data during recording
      recorder.start(options.timeslice || 1000);
      console.log("MediaRecorder started");
      mediaRecorderRef.current = recorder;
      
      setIsRecording(true);
      setIsPaused(false);
      
      // Start the timer
      startTimer();
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: "Recording Failed",
        description: "Could not start recording. Please try again.",
        variant: "destructive"
      });
    }
  }, [options, handleDataAvailable, handleRecordingStop, startTimer]);
  
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused && 'pause' in mediaRecorderRef.current) {
      console.log("Pausing recording");
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [isRecording, isPaused, stopTimer]);
  
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused && 'resume' in mediaRecorderRef.current) {
      console.log("Resuming recording");
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [isRecording, isPaused, startTimer]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      console.log("Stopping recording");
      mediaRecorderRef.current.stop();
      // The actual state updates happen in the onstop handler
    } else {
      console.log("No active recording to stop");
    }
  }, []);
  
  // Reset recording state
  const resetRecording = useCallback(() => {
    console.log("Resetting recording state");
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    chunksRef.current = [];
  }, [recordedUrl]);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("Cleaning up recording resources");
    // Stop media recorder if active
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      mediaRecorderRef.current.stop();
    }
    
    // Clear timer
    stopTimer();
    
    // Revoke object URL
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    
    // Clear state
    setIsRecording(false);
    setIsPaused(false);
  }, [recordedUrl, stopTimer]);

  return {
    // State
    isRecording,
    isPaused,
    recordingDuration,
    recordedBlob,
    recordedUrl,
    
    // Methods
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    cleanup
  };
}
