
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
      if (!audioBlob) {
        throw new Error("Audio blob is null or undefined");
      }
      
      // Revoke any existing URL to prevent memory leaks
      if (audioUrl) {
        try {
          URL.revokeObjectURL(audioUrl);
          console.log("Revoked previous audio URL:", audioUrl);
        } catch (e) {
          console.error("Error revoking previous audio URL:", e);
        }
      }
      
      const newUrl = URL.createObjectURL(audioBlob);
      console.log("Setting audio URL manually first:", newUrl);
      setAudioUrl(newUrl);
      
      // Also set the blob and base64 immediately
      setAudioBlob(audioBlob);
      setAudioBase64(audioBase64);
      
      // Then proceed with media handling (transcription, etc)
      const result = await handleMediaReady(audioBlob, audioBase64);
      console.log("Audio processing completed with result:", result);
      
      // Double-check that we still have a valid URL after processing
      if (!audioUrl) {
        console.log("Audio URL was lost during processing, recreating...");
        const recreatedUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(recreatedUrl);
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
