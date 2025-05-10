
import React from "react";
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
  // Render empty state when no audio
  if (!audioUrl && !isRecording) {
    return (
      <AudioEmptyState 
        isInitializing={isInitializing}
        hasPermission={hasPermission}
        onStartRecording={onStartRecording}
      />
    );
  }
  
  // Render recording state
  if (isRecording) {
    return (
      <AudioRecordingState 
        audioDuration={audioDuration}
        onStopRecording={onStopRecording}
      />
    );
  }
  
  // Render audio player
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
