
import { useMediaRecording } from "./useMediaRecording";
import { toast } from "@/components/ui/use-toast";

export function useAudioRecordingHandler() {
  const {
    showRecorder: showAudioRecorder,
    setShowRecorder: setShowAudioRecorder,
    mediaBlob: audioBlob,
    mediaBase64: audioBase64,
    mediaUrl: audioUrl,
    isTranscribing: isTranscribingAudio,
    transcription: audioTranscription,
    handleMediaReady,
    clearMedia,
    setMediaUrl: setAudioUrl,
    setTranscription: setAudioTranscription,
    setMediaBase64: setAudioBase64,
    setMediaBlob: setAudioBlob
  } = useMediaRecording("audio");
  
  // Wrapper functions with audio-specific naming
  const handleAudioReady = async (audioBlob: Blob, audioBase64: string) => {
    console.log("useAudioRecordingHandler: handleAudioReady called with blob size:", audioBlob.size);
    try {
      // Create URL manually first to ensure we have it immediately for playback
      const newUrl = URL.createObjectURL(audioBlob);
      console.log("Setting audio URL manually first:", newUrl);
      setAudioUrl(newUrl);
      
      // Also set the blob and base64 immediately
      setAudioBlob(audioBlob);
      setAudioBase64(audioBase64);
      
      // Then proceed with media handling (transcription, etc)
      const result = await handleMediaReady(audioBlob, audioBase64);
      
      return result;
    } catch (error) {
      console.error("Error in handleAudioReady:", error);
      toast({
        title: "Error",
        description: "Failed to process audio recording",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const clearAudio = () => {
    console.log("Clearing audio from useAudioRecordingHandler");
    return clearMedia();
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
    clearAudio,
    setAudioUrl,
    setAudioTranscription,
    setAudioBase64,
    setAudioBlob
  };
}
