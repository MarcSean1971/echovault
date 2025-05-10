
import { useMediaInitialization } from './useMediaInitialization';
import { useMessageTypeEffect } from './useMessageTypeEffect';
import { useMediaStreamInitialization } from './useMediaStreamInitialization';
import { useEffect } from 'react';

interface UseMediaStateManagerProps {
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

export function useMediaStateManager(props: UseMediaStateManagerProps) {
  // Get the media initialization state
  const {
    hasAttemptedVideoInit,
    setHasAttemptedVideoInit,
    isInitializing,
    setIsInitializing,
    initTimeoutRef,
    mountedRef
  } = useMediaInitialization(props);
  
  // Debug log when props change
  useEffect(() => {
    console.log("MediaStateManager: Props updated", {
      messageType: props.messageType,
      hasVideoUrl: !!props.videoUrl,
      hasVideoStream: !!props.videoPreviewStream,
      hasAudioUrl: !!props.audioUrl,
      showInlineRecording: props.showInlineRecording,
      initializedFromMessage: props.initializedFromMessage,
      isAudioInitializationAttempted: props.isAudioInitializationAttempted
    });
    
    // Special case for edit page - we need to force initialize when on audio message type
    // but only if we don't have audio content already (check for audioUrl)
    if (props.messageType === "audio" && !props.audioUrl && !props.isAudioInitializationAttempted) {
      console.log("MediaStateManager: Auto-initializing microphone for audio message type");
      
      // Use a short timeout to ensure React has completed rendering
      const initTimeout = setTimeout(() => {
        if (mountedRef.current) {
          console.log("MediaStateManager: Executing delayed microphone initialization");
          props.forceInitializeMicrophone().catch(err => {
            console.error("MediaStateManager: Failed to initialize microphone:", err);
          });
        }
      }, 500);
      
      return () => clearTimeout(initTimeout);
    }
  }, [
    props.messageType, 
    props.videoUrl, 
    props.videoPreviewStream, 
    props.audioUrl, 
    props.showInlineRecording, 
    props.initializedFromMessage,
    props.isAudioInitializationAttempted,
    props.forceInitializeMicrophone,
    mountedRef
  ]);
  
  // Handle message type changes
  useMessageTypeEffect({
    ...props,
    setHasAttemptedVideoInit
  });
  
  // Handle media stream initialization
  useMediaStreamInitialization({
    ...props,
    hasAttemptedVideoInit,
    isInitializing,
    mountedRef,
    initTimeoutRef,
    setIsInitializing,
    setHasAttemptedVideoInit
  });
  
  return null;
}
