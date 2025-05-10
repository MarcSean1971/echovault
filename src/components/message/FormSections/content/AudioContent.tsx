
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
  transcription?: string | null;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onClearAudio: () => void;
  onTranscribeAudio?: () => Promise<void>;
  inDialog?: boolean;
}

export function AudioContent({
  audioUrl,
  audioDuration = 0,
  isRecording,
  isInitializing,
  hasPermission,
  transcription,
  onStartRecording,
  onStopRecording,
  onClearAudio,
  onTranscribeAudio,
  inDialog = false
}: AudioContentProps) {
  // Log state changes to help with debugging
  useEffect(() => {
    console.log("AudioContent: Rendering with state", { 
      audioUrl: audioUrl ? "present" : "null",
      isRecording,
      isInitializing,
      hasTranscription: !!transcription
    });
  }, [audioUrl, isRecording, isInitializing, transcription]);

  // CRITICAL: Always prioritize showing existing audio if available
  if (audioUrl) {
    return (
      <AudioPlayerState
        audioUrl={audioUrl}
        audioDuration={audioDuration}
        transcription={transcription}
        onClearAudio={onClearAudio}
        onTranscribeAudio={onTranscribeAudio}
        inDialog={inDialog}
      />
    );
  }
  
  // Next priority: Show recording state if actively recording
  if (isRecording) {
    return (
      <AudioRecordingState 
        audioDuration={audioDuration}
        onStopRecording={onStopRecording}
      />
    );
  }
  
  // Default: Show empty state when no audio and not recording
  return (
    <AudioEmptyState 
      isInitializing={isInitializing}
      hasPermission={hasPermission}
      onStartRecording={onStartRecording}
    />
  );
}
