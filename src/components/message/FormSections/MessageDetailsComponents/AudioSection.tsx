
import { useState, useEffect } from "react";
import { AudioContent } from "../content/AudioContent";

interface AudioSectionProps {
  messageType: string;
  audioUrl: string | null;
  audioBlob: Blob | null;
  audioDuration: number;
  isAudioRecording: boolean;
  isAudioInitializing: boolean;
  hasAudioPermission: boolean | null;
  startAudioRecording: () => Promise<boolean>;  // Keep as Promise<boolean>
  stopAudioRecording: () => void;
  clearAudio: () => void;
}

export function AudioSection({
  messageType,
  audioUrl,
  audioBlob,
  audioDuration,
  isAudioRecording,
  isAudioInitializing,
  hasAudioPermission,
  startAudioRecording,
  stopAudioRecording,
  clearAudio
}: AudioSectionProps) {
  const [initAttempted, setInitAttempted] = useState(false);
  
  // Track when initialization is attempted
  useEffect(() => {
    if (isAudioInitializing && !initAttempted) {
      setInitAttempted(true);
    }
  }, [isAudioInitializing, initAttempted]);
  
  // For debugging - log props when they change
  useEffect(() => {
    console.log("AudioSection props updated:", { 
      messageType, 
      hasAudioUrl: !!audioUrl,
      hasAudioBlob: !!audioBlob,
      audioDuration,
      isRecording: isAudioRecording
    });
  }, [messageType, audioUrl, audioBlob, audioDuration, isAudioRecording]);
  
  // Create a wrapper function that explicitly returns Promise<void>
  const handleStartRecordingWrapper = async (): Promise<void> => {
    try {
      // Mark that we're attempting initialization
      setInitAttempted(true);
      
      // Use void operator to explicitly discard the boolean return value
      const success = await startAudioRecording();
      
      if (!success) {
        console.error("Audio recording failed to start");
      }
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
      onStartRecording={handleStartRecordingWrapper}
      onStopRecording={stopAudioRecording}
      onClearAudio={clearAudio}
      inDialog={false}
      initAttempted={initAttempted}
    />
  );
}
