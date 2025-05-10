
import { useState } from "react";
import { useContentUpdater } from "../useContentUpdater";

export function useAudioTranscription() {
  const [audioTranscription, setAudioTranscription] = useState<string | null>(null);
  const { handleAudioContentUpdate } = useContentUpdater();

  // Handle audio transcription
  const handleTranscribeAudio = async (audioBlob: Blob | null, transcribeAudio: () => Promise<string | null>) => {
    if (!audioBlob) return;
    
    try {
      const transcription = await transcribeAudio();
      setAudioTranscription(transcription);
      
      // Update the audio content with transcription
      if (audioBlob) {
        await handleAudioContentUpdate(audioBlob, transcription);
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  };

  return {
    audioTranscription,
    setAudioTranscription,
    handleTranscribeAudio
  };
}
