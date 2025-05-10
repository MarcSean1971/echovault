
import { useEffect } from 'react';

interface UseMessageTypeEffectProps {
  messageType: string;
  videoUrl: string | null;
  videoPreviewStream: MediaStream | null;
  audioUrl: string | null;
  showInlineRecording: boolean;
  setShowInlineRecording: (show: boolean) => void;
  initializedFromMessage: boolean;
  setHasAttemptedVideoInit: (value: boolean) => void;
}

export function useMessageTypeEffect({
  messageType,
  videoUrl,
  videoPreviewStream,
  audioUrl,
  showInlineRecording,
  setShowInlineRecording,
  initializedFromMessage,
  setHasAttemptedVideoInit
}: UseMessageTypeEffectProps) {
  // Initialize the camera or microphone when switching to media mode
  useEffect(() => {
    console.log("MessageDetails: messageType changed to", messageType, {
      videoUrl, 
      audioUrl, 
      initializedFromMessage, 
      showInlineRecording
    });
    
    // Reset the initialization state when the message type changes
    setHasAttemptedVideoInit(false);
    
    // Don't automatically show recording UI if we already have content
    if (messageType === "video") {
      if (videoUrl || initializedFromMessage) {
        console.log("Video mode with existing content detected. Not showing inline recording.");
        // Make sure we don't show recording UI for existing video
        setShowInlineRecording(false);
      } else if (!videoUrl && !videoPreviewStream && !showInlineRecording) {
        console.log("Video mode detected without content. Setting showInlineRecording to true");
        setShowInlineRecording(true);
      }
    }
    
    if (messageType === "audio") {
      if (audioUrl || initializedFromMessage) {
        console.log("Audio mode with existing content detected. Not showing inline recording.");
        // Make sure we don't show recording UI for existing audio
        setShowInlineRecording(false);
      } else if (!audioUrl && !showInlineRecording) {
        console.log("Audio mode detected without content. Setting showInlineRecording to true");
        setShowInlineRecording(true);
      }
    }
  }, [
    messageType, 
    videoUrl, 
    videoPreviewStream, 
    audioUrl, 
    showInlineRecording, 
    setShowInlineRecording,
    initializedFromMessage,
    setHasAttemptedVideoInit
  ]);
}
