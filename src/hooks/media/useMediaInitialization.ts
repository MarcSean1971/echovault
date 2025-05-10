
import { useState, useRef, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";

interface UseMediaInitializationProps {
  messageType: string;
  videoUrl: string | null;
  videoPreviewStream: MediaStream | null;
  audioUrl: string | null;
  showInlineRecording: boolean;
  setShowInlineRecording: (show: boolean) => void;
  forceInitializeCamera: () => Promise<boolean>;
  forceInitializeMicrophone: () => Promise<boolean>;
  isAudioInitializationAttempted: boolean;
  initializedFromMessage: boolean;
}

export function useMediaInitialization({
  messageType,
  videoUrl,
  videoPreviewStream,
  audioUrl,
  showInlineRecording,
  setShowInlineRecording,
  forceInitializeCamera,
  forceInitializeMicrophone,
  isAudioInitializationAttempted,
  initializedFromMessage
}: UseMediaInitializationProps) {
  const [hasAttemptedVideoInit, setHasAttemptedVideoInit] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  // Set up the mounted ref for cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    // Check if we need to initialize audio on mount for edit page
    if (messageType === "audio" && !audioUrl && !isAudioInitializationAttempted && !initializedFromMessage) {
      console.log("MediaInitialization: Auto-initializing microphone on mount for audio message");
      
      // Small delay to ensure component is fully mounted
      const initTimeout = setTimeout(() => {
        if (mountedRef.current) {
          setIsInitializing(true);
          console.log("MediaInitialization: Executing delayed microphone initialization on mount");
          
          forceInitializeMicrophone()
            .then(success => {
              console.log("MediaInitialization: Initial microphone init result:", success);
              if (mountedRef.current) setIsInitializing(false);
            })
            .catch(err => {
              console.error("MediaInitialization: Failed to initialize microphone on mount:", err);
              if (mountedRef.current) setIsInitializing(false);
              
              toast({
                title: "Audio Initialization",
                description: "Please click the Start Recording button to initialize your microphone.",
                variant: "default"
              });
            });
        }
      }, 1000);
      
      initTimeoutRef.current = initTimeout;
    }
    
    return () => {
      mountedRef.current = false;
      
      // Clear any timeouts on unmount
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, [
    messageType, 
    audioUrl, 
    isAudioInitializationAttempted, 
    forceInitializeMicrophone,
    initializedFromMessage
  ]);
  
  return {
    hasAttemptedVideoInit,
    setHasAttemptedVideoInit,
    isInitializing,
    setIsInitializing,
    initTimeoutRef,
    mountedRef
  };
}
