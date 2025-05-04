
import { useState } from "react";
import { transcribeAudio } from "@/services/messages/transcriptionService";
import { toast } from "@/components/ui/use-toast";

export function useAudioRecordingHandler() {
  // Audio recording states
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [audioTranscription, setAudioTranscription] = useState<string | null>(null);
  
  // Function to handle audio recording completion
  const handleAudioReady = async (audioBlob: Blob, audioBase64: string) => {
    setAudioBlob(audioBlob);
    setAudioBase64(audioBase64);
    setAudioUrl(URL.createObjectURL(audioBlob));
    
    // Start transcribing the audio
    setIsTranscribingAudio(true);
    try {
      const transcription = await transcribeAudio(audioBase64, 'audio/webm');
      setAudioTranscription(transcription);
      
      // Store both audio data and transcription in content as JSON
      const contentData = {
        audioData: audioBase64,
        transcription: transcription
      };
      
      toast({
        title: "Audio transcription complete",
        description: "Your audio has been successfully transcribed.",
      });
      
      return contentData;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast({
        title: "Transcription failed",
        description: "Could not transcribe audio. Audio will be saved without transcription.",
        variant: "destructive",
      });
      
      // Still save the audio data in content even if transcription fails
      const contentData = {
        audioData: audioBase64,
        transcription: null
      };
      
      return contentData;
    } finally {
      setIsTranscribingAudio(false);
    }
  };
  
  // Function to clear recorded audio
  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioBase64(null);
    setAudioUrl(null);
    setAudioTranscription(null);
    return "";
  };

  return {
    showAudioRecorder,
    setShowAudioRecorder,
    audioBlob,
    audioBase64,
    audioUrl,
    isTranscribingAudio,
    audioTranscription,
    handleAudioReady,
    clearAudio
  };
}
