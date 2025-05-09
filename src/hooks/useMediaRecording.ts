
import { useState, useCallback, useEffect } from "react";
import { transcribeAudio, transcribeVideo } from '@/services/messages/transcriptionService';
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
  
  // Clean up URL when component unmounts
  useEffect(() => {
    return () => {
      if (mediaUrl) {
        console.log(`Cleaning up ${mediaType} URL:`, mediaUrl);
        try {
          URL.revokeObjectURL(mediaUrl);
        } catch (e) {
          console.error(`Error revoking ${mediaType} URL:`, e);
        }
      }
    };
  }, [mediaUrl, mediaType]);
  
  // Function to handle media recording completion
  const handleMediaReady = useCallback(async (blob: Blob, base64: string) => {
    console.log(`Processing new ${mediaType}, blob size: ${blob.size} bytes`);
    
    // Set state immediately for UI updates
    setMediaBlob(blob);
    setMediaBase64(base64);
    
    // Ensure we have a proper URL for playback
    try {
      // Clean up previous URL if exists
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setMediaUrl(url);
      console.log(`Created new URL for ${mediaType}: ${url}`);
    } catch (e) {
      console.error(`Error creating URL for ${mediaType}:`, e);
      toast({
        title: "Media Error",
        description: `Failed to create ${mediaType} playback URL`,
        variant: "destructive"
      });
    }
    
    // Start transcribing the media
    setIsTranscribing(true);
    try {
      const mimeType = mediaType === "audio" ? 'audio/webm' : 'video/webm';
      const transcriptionText = await transcribeMedia(base64, mimeType);
      setTranscription(transcriptionText);
      console.log(`${mediaTypeLabel} transcription completed:`, transcriptionText);
      
      // Store both media data and transcription in content as JSON
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
  }, [mediaUrl, mediaType, mediaDataKey, mediaTypeLabel, transcribeMedia]);
  
  // Function to clear recorded media
  const clearMedia = useCallback(() => {
    if (mediaUrl) {
      console.log(`Clearing ${mediaType} URL:`, mediaUrl);
      try {
        URL.revokeObjectURL(mediaUrl);
      } catch (e) {
        console.error(`Error revoking ${mediaType} URL:`, e);
      }
    }
    
    setMediaBlob(null);
    setMediaBase64(null);
    setMediaUrl(null);
    setTranscription(null);
    return "";
  }, [mediaUrl, mediaType]);

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
    setTranscription,
    setMediaBase64,
    setMediaBlob
  };
}
