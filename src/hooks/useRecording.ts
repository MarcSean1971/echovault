
import { useRef, useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface UseRecordingOptions {
  onRecordingComplete?: (blob: Blob, url: string) => void;
  mimeType?: string;
  timeslice?: number;
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
    if (event.data.size > 0) {
      chunksRef.current.push(event.data);
    }
  }, []);
  
  const handleRecordingStop = useCallback(() => {
    const mimeType = options.mimeType || 'video/webm';
    const recordedBlob = new Blob(chunksRef.current, { type: mimeType });
    const url = URL.createObjectURL(recordedBlob);
    
    setRecordedBlob(recordedBlob);
    setRecordedUrl(url);
    
    if (options.onRecordingComplete) {
      options.onRecordingComplete(recordedBlob, url);
    }
  }, [options]);
  
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
      
      // Initialize MediaRecorder
      const mimeType = options.mimeType || 'video/webm';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.onstop = handleRecordingStop;
      
      // Start recording
      mediaRecorderRef.current.start(options.timeslice);
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
  }, [stream, options, handleDataAvailable, handleRecordingStop, startTimer]);
  
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [isRecording, isPaused, stopTimer]);
  
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [isRecording, isPaused, startTimer]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  }, [isRecording, stopTimer]);
  
  // Reset recording state
  const resetRecording = useCallback(() => {
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
