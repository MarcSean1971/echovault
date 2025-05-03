
import { useRef, useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface UseRecordingOptions {
  onRecordingComplete?: (blob: Blob, url: string) => void;
  mimeType?: string;
  timeslice?: number;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

export function useRecording(
  stream: MediaStream | null,
  options: UseRecordingOptions = {}
) {
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
  
  // Get supported mime type for video recording
  const getSupportedMimeType = useCallback(() => {
    const defaultType = 'video/webm';
    const preferredTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of preferredTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`Using supported mime type: ${type}`);
        return type;
      }
    }
    
    console.log(`Defaulting to mime type: ${defaultType}`);
    return defaultType;
  }, []);
  
  // Timer functions
  const startTimer = useCallback(() => {
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
    
    if (chunksRef.current.length === 0) {
      console.error("No data chunks recorded");
      toast({
        title: "Recording Error",
        description: "No data was recorded. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    const mimeType = options.mimeType || getSupportedMimeType();
    const recordedBlob = new Blob(chunksRef.current, { type: mimeType });
    console.log(`Created blob of size: ${recordedBlob.size}, type: ${recordedBlob.type}`);
    
    const url = URL.createObjectURL(recordedBlob);
    
    setRecordedBlob(recordedBlob);
    setRecordedUrl(url);
    
    if (options.onRecordingComplete) {
      options.onRecordingComplete(recordedBlob, url);
    }
  }, [options, getSupportedMimeType]);
  
  // Recording control functions
  const startRecording = useCallback(() => {
    if (!stream) {
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
      const mimeType = options.mimeType || getSupportedMimeType();
      
      console.log("Starting MediaRecorder with options:", {
        mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000, // 2.5 Mbps default
        audioBitsPerSecond: options.audioBitsPerSecond || 128000 // 128 kbps default
      });
      
      // Initialize MediaRecorder with options
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000
      });
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.onstop = handleRecordingStop;
      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Recording Error",
          description: "An error occurred during recording. Please try again.",
          variant: "destructive"
        });
        stopRecording();
      };
      
      // Start recording with timeslice to get data during recording
      mediaRecorderRef.current.start(options.timeslice || 1000);
      console.log("MediaRecorder started");
      
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
  }, [stream, options, handleDataAvailable, handleRecordingStop, startTimer, getSupportedMimeType]);
  
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
    if (mediaRecorderRef.current && isRecording) {
      console.log("Stopping recording");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  }, [isRecording, stopTimer]);
  
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Clear timer
    stopTimer();
    
    // Revoke object URL
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
  }, [isRecording, recordedUrl, stopTimer]);

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
