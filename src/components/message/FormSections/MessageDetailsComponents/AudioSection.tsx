
import { useState } from "react";
import { AudioContent } from "../content/AudioContent";

interface AudioSectionProps {
  messageType: string;
  audioUrl: string | null;
  audioBlob: Blob | null;
  audioDuration: number;
  isAudioRecording: boolean;
  isAudioInitializing: boolean;
  hasAudioPermission: boolean | null;
  audioTranscription: string | null;
  startAudioRecording: () => Promise<boolean>;  // Keep as Promise<boolean>
  stopAudioRecording: () => void;
  clearAudio: () => void;
  onTranscribeAudio: () => Promise<void>;
}

export function AudioSection({
  messageType,
  audioUrl,
  audioBlob,
  audioDuration,
  isAudioRecording,
  isAudioInitializing,
  hasAudioPermission,
  audioTranscription,
  startAudioRecording,
  stopAudioRecording,
  clearAudio,
  onTranscribeAudio
}: AudioSectionProps) {
  // Use the original function directly - AudioSection handles the Promise<boolean> return type
  if (messageType !== "audio") return null;

  return (
    <AudioContent
      audioUrl={audioUrl}
      audioDuration={audioDuration}
      isRecording={isAudioRecording}
      isInitializing={isAudioInitializing}
      hasPermission={hasAudioPermission}
      transcription={audioTranscription}
      onStartRecording={startAudioRecording}  // Pass the original Promise<boolean> function
      onStopRecording={stopAudioRecording}
      onClearAudio={clearAudio}
      onTranscribeAudio={onTranscribeAudio}
      inDialog={false}
    />
  );
}
