
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
  // Create a wrapper function that explicitly returns Promise<void>
  const handleStartRecordingWrapper = async (): Promise<void> => {
    try {
      // Use void operator to explicitly discard the boolean return value
      void await startAudioRecording();
      // No return statement ensures Promise<void>
    } catch (error) {
      console.error("Error in handleStartRecordingWrapper:", error);
      // No re-throw to maintain Promise<void>
    }
  };

  if (messageType !== "audio") return null;

  return (
    <AudioContent
      audioUrl={audioUrl}
      audioDuration={audioDuration}
      isRecording={isAudioRecording}
      isInitializing={isAudioInitializing}
      hasPermission={hasAudioPermission}
      transcription={audioTranscription}
      onStartRecording={handleStartRecordingWrapper}
      onStopRecording={stopAudioRecording}
      onClearAudio={clearAudio}
      onTranscribeAudio={onTranscribeAudio}
      inDialog={false}
    />
  );
}
