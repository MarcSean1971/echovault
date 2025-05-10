
import React from 'react';
import { useMediaStateManager } from '@/hooks/media/useMediaStateManager';

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

export function MediaStateManager(props: MediaStateManagerProps) {
  // Use our custom hook for all media state management logic
  useMediaStateManager(props);

  // This component doesn't render anything, it just manages media state
  return null;
}
