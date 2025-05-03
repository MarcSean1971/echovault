
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

interface UseAudioRecorderOptions {
  onRecordingComplete?: (blob: Blob, audioURL: string) => void;
}

export function useAudioRecorder(options?: UseAudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check for browser support
  useEffect(() => {
    // More robust browser compatibility check
    const checkCompatibility = () => {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        setIsBrowserSupported(false);
        console.error("Browser does not support MediaRecorder API");
        toast({
          title: "Browser Not Supported",
          description: "Your browser doesn't support audio recording functionality.",
          variant: "destructive"
        });
        return false;
      }
      return true;
    };

    checkCompatibility();
    
    return () => {
      // Clean up resources when component unmounts
      stopRecording();
      
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Make sure we close any open media streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []);
  
  // Separate function to handle timer start
  const startTimer = () => {
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
  };
  
  // Separate function to stop timer
  const stopTimer = () => {
    console.log("Stopping timer, ref:", timerRef.current);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Timer stopped");
    }
  };
  
  const startRecording = async () => {
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
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
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
        if (audioChunksRef.current.length === 0) {
          console.warn("No audio data recorded");
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log("Audio blob created:", audioBlob.size);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioBlob(audioBlob);
        
        // Notify about recording completion if callback provided
        if (options?.onRecordingComplete) {
          options.onRecordingComplete(audioBlob, url);
        }
        
        // Close the stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log("Audio track stopped:", track.id);
          });
          streamRef.current = null;
        }
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
  };
  
  const pauseRecording = () => {
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
  };
  
  const resumeRecording = () => {
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
  };
  
  const stopRecording = () => {
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
  };
  
  const togglePlayback = () => {
    if (!audioRef.current || !audioURL) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  
  const reset = () => {
    console.log("Resetting audio recorder");
    
    // Stop any ongoing recording
    stopRecording();
    
    // Clear audio resources
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    // Reset state
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);
    audioChunksRef.current = [];
    setPermissionDenied(false);
  };

  return {
    isRecording,
    isPaused,
    isPlaying,
    recordingDuration,
    audioURL,
    audioBlob,
    isBrowserSupported,
    permissionDenied,
    audioRef,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePlayback,
    handleAudioEnded,
    reset
  };
}
