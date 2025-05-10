
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
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null); // No longer specifying as RefObject
  const mountedRef = useRef(true);
  
  // Set up the mounted ref for cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      
      // Clear any timeouts on unmount
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, []);
  
  return {
    hasAttemptedVideoInit,
    setHasAttemptedVideoInit,
    isInitializing,
    setIsInitializing,
    initTimeoutRef,
    mountedRef
  };
}
