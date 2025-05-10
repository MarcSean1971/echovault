
import React, { useEffect } from 'react';

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
  isAudioInitializationAttempted
}: MediaStateManagerProps) {
  // Initialize the camera or microphone when switching to media mode
  useEffect(() => {
    console.log("MessageDetails: messageType changed to", messageType);
    
    if (messageType === "video" && !videoUrl && !videoPreviewStream && !showInlineRecording) {
      console.log("Video mode detected. Setting showInlineRecording to true");
      setShowInlineRecording(true);
    }
    
    if (messageType === "audio" && !audioUrl && !showInlineRecording) {
      console.log("Audio mode detected. Setting showInlineRecording to true");
      setShowInlineRecording(true);
    }
  }, [messageType, videoUrl, videoPreviewStream, audioUrl, showInlineRecording, setShowInlineRecording]);

  // Initialize camera preview when showing inline recording UI
  useEffect(() => {
    // For video mode
    if (showInlineRecording && messageType === "video" && !videoUrl && !videoPreviewStream) {
      console.log("Initializing camera preview for inline recording");
      // Use forceInitializeCamera to ensure we get a fresh stream
      forceInitializeCamera().catch(error => {
        console.error("Failed to initialize camera stream:", error);
      });
    }
    
    // For audio mode - only initialize if not already attempted
    if (showInlineRecording && messageType === "audio" && !audioUrl && !isAudioInitializationAttempted) {
      console.log("Initializing microphone for inline recording");
      // Use forceInitializeMicrophone to ensure we get a fresh stream
      forceInitializeMicrophone().catch(error => {
        console.error("Failed to initialize microphone stream:", error);
      });
    }
  }, [
    showInlineRecording, 
    messageType, 
    videoUrl, 
    videoPreviewStream, 
    audioUrl, 
    forceInitializeCamera, 
    forceInitializeMicrophone,
    isAudioInitializationAttempted
  ]);

  // This component doesn't render anything, it just manages media state
  return null;
}
