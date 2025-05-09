
import { useState } from "react";
import { transcribeAudio, transcribeVideo } from "@/services/messages/transcriptionService";
import { toast } from "@/components/ui/use-toast";

export type MediaType = "audio" | "video";

export function useMediaRecording(mediaType: MediaType) {
  // Media recording states
  const [showRecorder, setShowRecorder] = useState(false);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  
  // Determine which transcription function to use based on media type
  const transcribeMedia = mediaType === "audio" ? transcribeAudio : transcribeVideo;
  const mediaTypeLabel = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
  const mediaDataKey = `${mediaType}Data`;
  
  // Function to handle media recording completion
  const handleMediaReady = async (blob: Blob, base64: string) => {
    setMediaBlob(blob);
    setMediaBase64(base64);
    setMediaUrl(URL.createObjectURL(blob));
    
    // Start transcribing the media
    setIsTranscribing(true);
    try {
      const mimeType = mediaType === "audio" ? 'audio/webm' : 'video/webm';
      const transcriptionText = await transcribeMedia(base64, mimeType);
      setTranscription(transcriptionText);
      
      // Store both media data and transcription in content as JSON
      // But we don't want to display this JSON in text inputs
      const contentData = {
        [mediaDataKey]: base64,
        transcription: transcriptionText
      };
      
      toast({
        title: `${mediaTypeLabel} transcription complete`,
        description: `Your ${mediaType} has been successfully transcribed.`,
      });
      
      return contentData;
    } catch (error) {
      console.error(`Error transcribing ${mediaType}:`, error);
      toast({
        title: "Transcription failed",
        description: `Could not transcribe ${mediaType}. ${mediaTypeLabel} will be saved without transcription.`,
        variant: "destructive",
      });
      
      // Still save the media data in content even if transcription fails
      const contentData = {
        [mediaDataKey]: base64,
        transcription: null
      };
      
      return contentData;
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Function to clear recorded media
  const clearMedia = () => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaBlob(null);
    setMediaBase64(null);
    setMediaUrl(null);
    setTranscription(null);
    return "";
  };

  return {
    showRecorder,
    setShowRecorder,
    mediaBlob,
    mediaBase64,
    mediaUrl,
    isTranscribing,
    transcription,
    handleMediaReady,
    clearMedia,
    setMediaUrl,
    setTranscription
  };
}
