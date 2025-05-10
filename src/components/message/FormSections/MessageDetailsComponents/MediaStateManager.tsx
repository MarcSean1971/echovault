
import React, { useEffect, useState, useRef } from 'react';

interface MediaStateManagerProps {
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

export function MediaStateManager({
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
}: MediaStateManagerProps) {
  const [hasAttemptedVideoInit, setHasAttemptedVideoInit] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  
  // Debug log when props change
  useEffect(() => {
    console.log("MediaStateManager: Props updated", {
      messageType,
      hasVideoUrl: !!videoUrl,
      hasVideoStream: !!videoPreviewStream,
      hasAudioUrl: !!audioUrl,
      showInlineRecording,
      initializedFromMessage
    });
  }, [messageType, videoUrl, videoPreviewStream, audioUrl, showInlineRecording, initializedFromMessage]);
  
  // Initialize the camera or microphone when switching to media mode
  useEffect(() => {
    console.log("MessageDetails: messageType changed to", messageType);
    
    // Reset the initialization state when the message type changes
    setHasAttemptedVideoInit(false);
    
    // Don't automatically show recording UI if we already have content
    // This is critical: we must respect initializedFromMessage and existing video/audio content
    if (messageType === "video" && !videoUrl && !videoPreviewStream && !showInlineRecording && !initializedFromMessage) {
      console.log("Video mode detected without content. Setting showInlineRecording to true");
      setShowInlineRecording(true);
    } else if (messageType === "video" && (videoUrl || initializedFromMessage)) {
      console.log("Video mode with existing content detected. Not showing inline recording.");
      // Make sure we don't show recording UI for existing video
      setShowInlineRecording(false);
    }
    
    if (messageType === "audio" && !audioUrl && !showInlineRecording && !initializedFromMessage) {
      console.log("Audio mode detected without content. Setting showInlineRecording to true");
      setShowInlineRecording(true);
    } else if (messageType === "audio" && (audioUrl || initializedFromMessage)) {
      console.log("Audio mode with existing content detected. Not showing inline recording.");
      // Make sure we don't show recording UI for existing audio
      setShowInlineRecording(false);
    }
  }, [
    messageType, 
    videoUrl, 
    videoPreviewStream, 
    audioUrl, 
    showInlineRecording, 
    setShowInlineRecording,
    initializedFromMessage
  ]);

  // Initialize camera preview when showing inline recording UI with better error handling
  useEffect(() => {
    const initializeMedia = async () => {
      // Don't initialize if we're already initializing or if we already attempted
      if (isInitializing || hasAttemptedVideoInit) {
        return;
      }
      
      // CRITICAL: Don't initialize if we have existing media content
      if ((messageType === "video" && videoUrl) || (messageType === "audio" && audioUrl) || initializedFromMessage) {
        console.log("Skipping media initialization because content already exists or was initialized from message");
        return;
      }
      
      // For video mode without existing content
      if (showInlineRecording && messageType === "video" && !videoUrl && !videoPreviewStream) {
        console.log("Initializing camera preview for inline recording");
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
          // Use forceInitializeCamera to ensure we get a fresh stream
          await forceInitializeCamera();
          console.log("Camera initialization successful");
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
          // Use forceInitializeMicrophone to ensure we get a fresh stream
          await forceInitializeMicrophone();
          console.log("Microphone initialization successful");
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
    initializedFromMessage
  ]);

  // This component doesn't render anything, it just manages media state
  return null;
}
