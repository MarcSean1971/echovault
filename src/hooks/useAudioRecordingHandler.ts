
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
      const result = await handleMediaReady(audioBlob, audioBase64);
      
      // Verify that audio URL was set
      console.log("Audio URL after handleMediaReady:", audioUrl);
      if (!audioUrl) {
        // Create URL manually if needed
        const newUrl = URL.createObjectURL(audioBlob);
        console.log("Setting audio URL manually:", newUrl);
        setAudioUrl(newUrl);
      }
      
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
