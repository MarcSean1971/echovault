
import React, { useEffect } from "react";
import { AudioEmptyState } from "./audio/AudioEmptyState";
import { AudioRecordingState } from "./audio/AudioRecordingState";
import { AudioPlayerState } from "./audio/AudioPlayerState";

interface AudioContentProps {
  audioUrl: string | null;
  audioDuration?: number;
  isRecording: boolean;
  isInitializing: boolean;
  hasPermission: boolean | null;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onClearAudio: () => void;
  inDialog?: boolean;
  initAttempted?: boolean;
}

export function AudioContent({
  audioUrl,
  audioDuration = 0,
  isRecording,
  isInitializing,
  hasPermission,
  onStartRecording,
  onStopRecording,
  onClearAudio,
  inDialog = false,
  initAttempted = false
}: AudioContentProps) {
  // Debug component state - CRITICAL for identifying state issues
  useEffect(() => {
    console.log("AudioContent: Rendering with state", { 
      audioUrl: audioUrl ? "present" : "null",
      isRecording,
      isInitializing,
      hasPermission,
      initAttempted,
      audioDuration
    });
  }, [audioUrl, isRecording, isInitializing, hasPermission, initAttempted, audioDuration]);

  // CRITICAL: Always prioritize showing existing audio if available
  // Explicitly check if audioUrl exists rather than relying on type coercion
  if (audioUrl !== null && audioUrl !== undefined) {
    console.log("AudioContent: Showing AudioPlayerState with URL", audioUrl.substring(0, 30) + "...");
    return (
      <AudioPlayerState
        audioUrl={audioUrl}
        audioDuration={audioDuration}
        onClearAudio={onClearAudio}
        inDialog={inDialog}
      />
    );
  }
  
  // Next priority: Show recording state if actively recording
  if (isRecording) {
    console.log("AudioContent: Showing AudioRecordingState");
    return (
      <AudioRecordingState 
        audioDuration={audioDuration}
        onStopRecording={onStopRecording}
      />
    );
  }
  
  // Default: Show empty state when no audio and not recording
  console.log("AudioContent: Showing AudioEmptyState");
  return (
    <AudioEmptyState 
      isInitializing={isInitializing}
      hasPermission={hasPermission}
      onStartRecording={onStartRecording}
    />
  );
}
