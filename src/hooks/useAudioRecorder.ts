
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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        
        if (isRecording) {
          try {
            mediaRecorderRef.current.stop();
          } catch (err) {
            console.error("Error stopping MediaRecorder:", err);
          }
        }
      }
      
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, audioURL]);
  
  const startRecording = async () => {
    // Reset state before starting
    audioChunksRef.current = [];
    setRecordingDuration(0);
    
    // Stop any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    console.log("Starting audio recording...");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Got audio stream:", stream);
      
      // Create new MediaRecorder instance
      mediaRecorderRef.current = new MediaRecorder(stream, { 
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      console.log("MediaRecorder created:", mediaRecorderRef.current);
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log("Data available:", event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        console.log("MediaRecorder stopped, processing chunks:", audioChunksRef.current.length);
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
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
        stream.getTracks().forEach(track => {
          track.stop();
          console.log("Audio track stopped:", track.id);
        });
      };
      
      // Start recording and update state
      mediaRecorderRef.current.start();
      console.log("MediaRecorder started");
      
      setIsRecording(true);
      setIsPaused(false);
      
      // Start the timer immediately after starting recording
      console.log("Starting recording timer");
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => {
          console.log("Recording duration:", prev + 1);
          return prev + 1;
        });
      }, 1000);
      
      console.log("Timer started:", timerRef.current);
      
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: "Recording Failed",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused && mediaRecorderRef.current.state === "recording") {
      console.log("Pausing recording");
      try {
        if ('pause' in mediaRecorderRef.current) {
          mediaRecorderRef.current.pause();
          setIsPaused(true);
          
          // Pause the timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            console.log("Timer paused");
          }
        } else {
          console.warn("MediaRecorder pause method not supported");
        }
      } catch (err) {
        console.error("Error pausing recording:", err);
      }
    }
  };
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused && mediaRecorderRef.current.state === "paused") {
      console.log("Resuming recording");
      try {
        if ('resume' in mediaRecorderRef.current) {
          mediaRecorderRef.current.resume();
          setIsPaused(false);
          
          // Resume the timer
          console.log("Restarting timer");
          timerRef.current = window.setInterval(() => {
            setRecordingDuration(prev => prev + 1);
          }, 1000);
        } else {
          console.warn("MediaRecorder resume method not supported");
        }
      } catch (err) {
        console.error("Error resuming recording:", err);
      }
    }
  };
  
  const stopRecording = () => {
    console.log("Stopping recording, current state:", mediaRecorderRef.current?.state);
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        console.log("MediaRecorder stopped");
        setIsRecording(false);
        setIsPaused(false);
        
        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          console.log("Timer stopped");
        }
      } catch (err) {
        console.error("Error stopping recording:", err);
      }
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
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);
    audioChunksRef.current = [];
  };

  return {
    isRecording,
    isPaused,
    isPlaying,
    recordingDuration,
    audioURL,
    audioBlob,
    isBrowserSupported,
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
