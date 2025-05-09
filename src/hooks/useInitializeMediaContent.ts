
import { useState, useEffect } from "react";
import { parseVideoContent } from "@/services/messages/mediaService";
import { Message } from "@/types/message";

/**
 * Hook to initialize media content when editing a message
 */
export function useInitializeMediaContent(message: Message | null) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null); 
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Parse the message content when the message changes
  useEffect(() => {
    if (!message?.content) return;
    
    console.log("useInitializeMediaContent: Initializing content for message type:", message.message_type);
    
    try {
      if (message.message_type === "video") {
        console.log("Processing video message type");
        const { videoData } = parseVideoContent(message.content);
        
        if (videoData) {
          // Create a Blob URL for the video player
          const binaryString = window.atob(videoData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          
          console.log("Created video blob URL:", url);
          console.log("Video blob size:", blob.size);
          setVideoUrl(url);
          setVideoBase64(videoData);
          setVideoBlob(blob);
          setHasInitialized(true);
        } else {
          console.log("No video data found in message content");
        }
      } else {
        try {
          // Try to parse the content as JSON (for media content)
          const contentObj = JSON.parse(message.content);
          
          // Check for video data
          if (contentObj.videoData) {
            // Create a Blob URL for the video player
            console.log("Found video data in JSON content");
            const videoBlob = base64ToBlob(contentObj.videoData, 'video/webm');
            const url = URL.createObjectURL(videoBlob);
            console.log("Created video blob URL from JSON:", url);
            console.log("Video blob size from JSON:", videoBlob.size);
            setVideoUrl(url);
            setVideoBase64(contentObj.videoData);
            setVideoBlob(videoBlob);
            setHasInitialized(true);
          }
          
          // Check for audio data
          if (contentObj.audioData) {
            // Create a Blob URL for the audio player
            const audioBlob = base64ToBlob(contentObj.audioData, 'audio/webm');
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            setAudioBase64(contentObj.audioData);
          }
        } catch (e) {
          // Not JSON or error parsing, content is likely plain text
          console.log("Content is not in JSON format or there was an error:", e);
        }
      }
    } catch (e) {
      console.error("Error initializing media content:", e);
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
    videoUrl,
    videoBase64,
    videoBlob,
    hasInitialized
  };
}
