
import React, { useEffect, useState } from 'react';

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
    if (messageType === "video" && !videoUrl && !videoPreviewStream && !showInlineRecording && !initializedFromMessage) {
      console.log("Video mode detected without content. Setting showInlineRecording to true");
      setShowInlineRecording(true);
    }
    
    if (messageType === "audio" && !audioUrl && !showInlineRecording && !initializedFromMessage) {
      console.log("Audio mode detected without content. Setting showInlineRecording to true");
      setShowInlineRecording(true);
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

  // Initialize camera preview when showing inline recording UI
  useEffect(() => {
    const initializeMedia = async () => {
      // Don't initialize if we're already initializing or if we already attempted
      if (isInitializing || hasAttemptedVideoInit) {
        return;
      }
      
      // For video mode without existing content
      if (showInlineRecording && messageType === "video" && !videoUrl && !videoPreviewStream) {
        console.log("Initializing camera preview for inline recording");
        setIsInitializing(true);
        
        try {
          // Use forceInitializeCamera to ensure we get a fresh stream
          await forceInitializeCamera();
          console.log("Camera initialization successful");
        } catch (error) {
          console.error("Failed to initialize camera stream:", error);
        } finally {
          setIsInitializing(false);
          setHasAttemptedVideoInit(true);
        }
      }
      
      // For audio mode - only initialize if not already attempted
      if (showInlineRecording && messageType === "audio" && !audioUrl && !isAudioInitializationAttempted) {
        console.log("Initializing microphone for inline recording");
        setIsInitializing(true);
        
        try {
          // Use forceInitializeMicrophone to ensure we get a fresh stream
          await forceInitializeMicrophone();
          console.log("Microphone initialization successful");
        } catch (error) {
          console.error("Failed to initialize microphone stream:", error);
        } finally {
          setIsInitializing(false);
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
    isInitializing
  ]);

  // This component doesn't render anything, it just manages media state
  return null;
}
