
import { useMediaRecording } from "./useMediaRecording";

export function useAudioRecordingHandler() {
  const {
    showRecorder: showAudioRecorder,
    setShowRecorder: setShowAudioRecorder,
    mediaBlob: audioBlob,
    mediaBase64: audioBase64,
    mediaUrl: audioUrl,
    isTranscribing: isTranscribingAudio,
    transcription: audioTranscription,
    handleMediaReady: handleMediaReady,
    clearMedia: clearMedia,
    setMediaUrl: setAudioUrl,
    setTranscription: setAudioTranscription,
    setMediaBase64: setAudioBase64
  } = useMediaRecording("audio");
  
  // Wrapper functions with audio-specific naming
  const handleAudioReady = async (audioBlob: Blob, audioBase64: string) => {
    return handleMediaReady(audioBlob, audioBase64);
  };
  
  const clearAudio = () => {
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
    setAudioBase64
  };
}
