import { useEffect } from 'react';

interface UseMediaStreamInitializationProps {
  showInlineRecording: boolean;
  messageType: string;
  videoUrl: string | null;
  videoPreviewStream: MediaStream | null;
  audioUrl: string | null;
  isInitializing: boolean;
  hasAttemptedVideoInit: boolean;
  isAudioInitializationAttempted: boolean;
  initializedFromMessage: boolean;
  mountedRef: React.RefObject<boolean>;
  initTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setIsInitializing: (value: boolean) => void;
  setHasAttemptedVideoInit: (value: boolean) => void;
  forceInitializeCamera: () => Promise<boolean>;
  forceInitializeMicrophone: () => Promise<boolean>;
}

export function useMediaStreamInitialization({
  showInlineRecording,
  messageType,
  videoUrl,
  videoPreviewStream,
  audioUrl,
  isInitializing,
  hasAttemptedVideoInit,
  isAudioInitializationAttempted,
  initializedFromMessage,
  mountedRef,
  initTimeoutRef,
  setIsInitializing,
  setHasAttemptedVideoInit,
  forceInitializeCamera,
  forceInitializeMicrophone
}: UseMediaStreamInitializationProps) {
  // Initialize camera preview when showing inline recording UI with better error handling
  useEffect(() => {
    // Log state for debugging
    console.log("MediaStreamInitialization: State check", {
      showInlineRecording,
      messageType,
      hasVideoUrl: !!videoUrl,
      videoUrl: videoUrl ? videoUrl.substring(0, 30) + "..." : null,
      hasVideoStream: !!videoPreviewStream,
      hasAudioUrl: !!audioUrl,
      isInitializing,
      hasAttemptedVideoInit,
      isAudioInitializationAttempted,
      initializedFromMessage
    });
    
    // Function to handle initialization
    const initializeMedia = async () => {
      // Don't initialize if we're already initializing or if we already attempted
      if (isInitializing || hasAttemptedVideoInit) {
        console.log("MediaStreamInitialization: Skipping - already initializing or attempted");
        return;
      }
      
      // CRITICAL: If we already have a video URL, do NOT initialize camera
      // This is key to fixing the edit mode issue
      if (videoUrl) {
        console.log("MediaStreamInitialization: Skipping - videoUrl exists:", 
                    videoUrl.substring(0, 30) + "...");
        return;
      }
      
      // Skip if initialized from message - critical to prevent overriding existing content
      if (initializedFromMessage) {
        console.log("MediaStreamInitialization: Skipping - initializedFromMessage flag is set");
        return;
      }
      
      // For video mode without existing content
      if (showInlineRecording && messageType === "video" && !videoUrl && !videoPreviewStream) {
        console.log("MediaStreamInitialization: Initializing camera preview for inline recording");
        setIsInitializing(true);
        
        // Set a timeout to reset the initialization state if it takes too long
        const timeout = setTimeout(() => {
          if (mountedRef.current) {
            console.log("Camera initialization timeout reached, resetting state");
            setIsInitializing(false);
            setHasAttemptedVideoInit(true);
          }
        }, 15000); // 15 seconds timeout
        
        initTimeoutRef.current = timeout;
        
        try {
          // Use void to explicitly discard the boolean return value
          void await forceInitializeCamera();
          console.log("Camera initialization completed");
        } catch (error) {
          console.error("Failed to initialize camera stream:", error);
          // Important: Reset state even on error
          if (mountedRef.current) {
            setIsInitializing(false);
          }
        } finally {
          // Always clean up the timeout
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          
          // Always ensure we mark initialization as attempted
          if (mountedRef.current) {
            setIsInitializing(false);
            setHasAttemptedVideoInit(true);
          }
        }
      }
      
      // For audio mode - only initialize if not already attempted
      if (showInlineRecording && messageType === "audio" && !audioUrl && !isAudioInitializationAttempted) {
        console.log("Initializing microphone for inline recording");
        setIsInitializing(true);
        
        // Set a timeout to reset the initialization state if it takes too long
        const timeout = setTimeout(() => {
          if (mountedRef.current) {
            console.log("Microphone initialization timeout reached, resetting state");
            setIsInitializing(false);
          }
        }, 15000); // 15 seconds timeout
        
        initTimeoutRef.current = timeout;
        
        try {
          // Use void to explicitly discard the boolean return value
          void await forceInitializeMicrophone();
          console.log("Microphone initialization completed");
        } catch (error) {
          console.error("Failed to initialize microphone stream:", error);
          // Important: Reset state even on error
          if (mountedRef.current) {
            setIsInitializing(false);
          }
        } finally {
          // Always clean up the timeout
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          
          // Always ensure initializing state is reset
          if (mountedRef.current) {
            setIsInitializing(false);
          }
        }
      }
    };
    
    initializeMedia();
  }, [
    showInlineRecording, 
    messageType, 
    videoUrl, 
    videoPreviewStream, 
    audioUrl, 
    forceInitializeCamera, 
    forceInitializeMicrophone,
    isAudioInitializationAttempted,
    hasAttemptedVideoInit,
    isInitializing,
    initializedFromMessage,
    mountedRef,
    initTimeoutRef,
    setIsInitializing,
    setHasAttemptedVideoInit
  ]);
}
