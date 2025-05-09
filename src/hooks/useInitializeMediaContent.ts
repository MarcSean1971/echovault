
import { useState, useEffect } from "react";
import { parseMessageTranscription } from "@/services/messages/mediaService";
import { Message } from "@/types/message";

/**
 * Hook to initialize media content when editing a message
 */
export function useInitializeMediaContent(message: Message | null) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioTranscription, setAudioTranscription] = useState<string | null>(null);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null); 
  const [videoTranscription, setVideoTranscription] = useState<string | null>(null);
  
  // Parse the message content when the message changes
  useEffect(() => {
    if (!message?.content) return;
    
    try {
      // Try to parse the content as JSON (for media content)
      const contentObj = JSON.parse(message.content);
      
      // Check for audio data
      if (contentObj.audioData) {
        // Create a Blob URL for the audio player
        const audioBlob = base64ToBlob(contentObj.audioData, 'audio/webm');
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBase64(contentObj.audioData);
        setAudioTranscription(contentObj.transcription || null);
      }
      
      // Check for video data
      if (contentObj.videoData) {
        // Create a Blob URL for the video player
        const videoBlob = base64ToBlob(contentObj.videoData, 'video/webm');
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
        setVideoBase64(contentObj.videoData);
        setVideoTranscription(contentObj.transcription || null);
      }
    } catch (e) {
      // Not JSON or error parsing, content is likely plain text
      console.log("Content is not in JSON format or there was an error:", e);
    }
    
    // Cleanup function to revoke object URLs when unmounting
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [message]);
  
  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string, type: string): Blob => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  };
  
  return {
    audioUrl,
    audioBase64,
    audioTranscription,
    videoUrl,
    videoBase64,
    videoTranscription
  };
}
