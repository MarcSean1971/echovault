
import { useState } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useContentUpdater() {
  const { setContent, setVideoContent, setAudioContent } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);

  // Update video content
  const handleVideoContentUpdate = async (blob: Blob) => {
    try {
      // Read the video blob as base64
      const base64 = await blobToBase64(blob);
      
      // Create formatted video content
      const formattedContent = JSON.stringify({
        videoData: base64,
        timestamp: new Date().toISOString()
      });
      
      // Update the form context with the video content
      setVideoContent(formattedContent);
      setContent(formattedContent);
      
      return formattedContent;
    } catch (err) {
      console.error("Error updating video content:", err);
      return null;
    }
  };
  
  // Update audio content
  const handleAudioContentUpdate = async (blob: Blob, transcription?: string) => {
    try {
      // Read the audio blob as base64
      const base64 = await blobToBase64(blob);
      
      // Create formatted audio content
      const formattedContent = JSON.stringify({
        audioData: base64,
        transcription: transcription || "",
        timestamp: new Date().toISOString()
      });
      
      // Update the form context with the audio content
      setAudioContent(formattedContent);
      setContent(formattedContent);
      
      return formattedContent;
    } catch (err) {
      console.error("Error updating audio content:", err);
      return null;
    }
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return {
    handleVideoContentUpdate,
    handleAudioContentUpdate,
    isTranscribingVideo,
    isTranscribingAudio
  };
}
