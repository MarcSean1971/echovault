
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { checkBrowserSupport } from "./audioUtils";
import { useAudioRecording } from "./useAudioRecording";
import { useAudioPlayback } from "./useAudioPlayback";
import { UseAudioRecorderOptions } from "./types";

export function useAudioRecorder(options?: UseAudioRecorderOptions) {
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  
  const {
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
  } = useAudioRecording();
  
  const {
    isPlaying,
    audioRef,
    togglePlayback,
    handleAudioEnded
  } = useAudioPlayback();

  // Check for browser support
  useEffect(() => {
    // More robust browser compatibility check
    setIsBrowserSupported(checkBrowserSupport());
    
    if (!checkBrowserSupport()) {
      console.error("Browser does not support MediaRecorder API");
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support audio recording functionality.",
        variant: "destructive"
      });
    }
    
    return () => {
      // Clean up resources when component unmounts
      cleanupRecording();
      
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL, cleanupRecording]);
  
  const reset = () => {
    console.log("Resetting audio recorder");
    
    // Stop any ongoing recording
    stopRecording();
    
    // Clear audio resources
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    // Reset state
    if (audioRef.current) {
      audioRef.current.src = "";
    }
  };

  const handleStartRecording = () => {
    startRecording(options);
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
    startRecording: handleStartRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePlayback,
    handleAudioEnded,
    reset
  };
}
