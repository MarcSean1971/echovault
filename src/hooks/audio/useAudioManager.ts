
import { useRef, useState } from "react";
import { useMediaStream } from "../video/useMediaStream";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook for managing audio stream initialization and cleanup
 */
export function useAudioManager() {
  const {
    previewStream,
    isInitializing,
    hasPermission,
    streamRef,
    initializeStream: initializeVideoStream,
    stopMediaStream,
    isStreamActive
  } = useMediaStream();
  
  // Track whether we've already attempted initialization to prevent loops
  const [isInitializationAttempted, setIsInitializationAttempted] = useState(false);
  const initializationAttemptedRef = useRef(false);
  
  // Initialize stream specifically for audio
  const initializeStream = async (forceNew = false) => {
    try {
      console.log("Audio recorder: initializing audio stream with forceNew =", forceNew);
      
      // Set attempted flag immediately to prevent multiple rapid attempts
      setIsInitializationAttempted(true);
      initializationAttemptedRef.current = true;
      
      // Always force new when explicitly requesting a new stream
      return await initializeVideoStream(forceNew, { audio: true, video: false });
    } catch (err) {
      console.error("Audio recorder: failed to initialize audio stream:", err);
      throw err;
    }
  };

  // Force initialize microphone with enhanced error handling
  const forceInitializeMicrophone = async () => {
    try {
      // Set the flag to prevent re-initialization
      setIsInitializationAttempted(true);
      initializationAttemptedRef.current = true;
      
      // Make sure any existing streams are stopped first
      if (isStreamActive()) {
        console.log("Stopping existing media stream before microphone initialization");
        stopMediaStream();
      }
      
      console.log("Forcing microphone initialization...");
      
      // Request a new stream with audio only
      await initializeStream(true);
      console.log("Force microphone initialization successful");
      return true;
    } catch (error: any) {
      console.error("Force microphone initialization failed:", error);
      
      // Provide user feedback on common errors
      let errorMessage = "Could not initialize microphone";
      
      if (error.name === "NotAllowedError" || error.message?.includes("permission")) {
        errorMessage = "Microphone access was denied. Please check your browser permissions.";
      } else if (error.name === "NotFoundError" || error.message?.includes("not found")) {
        errorMessage = "No microphone found. Please check your device connections.";
      } else if (error.name === "NotReadableError" || error.name === "AbortError") {
        errorMessage = "Your microphone is being used by another application. Please close other apps that might be using it.";
      }
      
      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  };

  return {
    previewStream,
    isInitializing,
    hasPermission,
    streamRef,
    initializeStream,
    stopMediaStream,
    isStreamActive,
    forceInitializeMicrophone,
    isInitializationAttempted
  };
}
