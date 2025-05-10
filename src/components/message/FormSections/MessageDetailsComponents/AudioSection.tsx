
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
  startAudioRecording: () => Promise<boolean>;
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
  const handleStartAudioRecordingWrapper = async (): Promise<void> => {
    try {
      // Call the function but explicitly ignore its return value
      await startAudioRecording();
      // No return statement to ensure void return type
    } catch (error) {
      console.error("Error in handleStartAudioRecordingWrapper:", error);
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
      onStartRecording={handleStartAudioRecordingWrapper}
      onStopRecording={stopAudioRecording}
      onClearAudio={clearAudio}
      onTranscribeAudio={onTranscribeAudio}
      inDialog={false}
    />
  );
}
