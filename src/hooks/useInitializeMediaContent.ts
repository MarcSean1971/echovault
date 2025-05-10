
import { useState, useEffect } from "react";
import { parseVideoContent } from "@/services/messages/mediaService";
import { Message } from "@/types/message";
import { base64ToBlob } from "@/utils/mediaUtils";

/**
 * Hook to initialize media content when editing a message
 */
export function useInitializeMediaContent(message: Message | null) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null); 
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [additionalText, setAdditionalText] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  // Parse the message content when the message changes
  useEffect(() => {
    if (!message?.content) {
      console.log("useInitializeMediaContent: No message content to initialize");
      return;
    }
    
    console.log("useInitializeMediaContent: Initializing content for message type:", message.message_type);
    console.log("useInitializeMediaContent: Content preview:", message.content.substring(0, 100) + "...");
    
    // Clear any previous initialization errors
    setInitializationError(null);
    
    try {
      // Try to handle video content first
      const { videoData, error, diagnostics } = parseVideoContent(message.content);
      
      if (videoData) {
        console.log("Processing video data from message content");
        try {
          // Create a Blob URL for the video player
          const blob = base64ToBlob(videoData, 'video/webm');
          const url = URL.createObjectURL(blob);
          
          console.log("Created video blob URL:", url);
          console.log("Video blob size:", blob.size);
          setVideoUrl(url);
          setVideoBase64(videoData);
          setVideoBlob(blob);
          
          // Check for additional text
          try {
            const contentObj = JSON.parse(message.content);
            if (contentObj.additionalText) {
              console.log("Found additional text with video:", contentObj.additionalText.substring(0, 50));
              setAdditionalText(contentObj.additionalText);
            }
          } catch (e) {
            console.error("Error parsing additional text from video content:", e);
          }
          
          setHasInitialized(true);
        } catch (e) {
          console.error("Error creating blob from video data:", e);
          setInitializationError(`Failed to create video blob: ${e}`);
        }
      } else {
        if (error) {
          console.log("Video parsing error:", error, diagnostics);
          
          // If this was expected to be a video message but we failed to parse it
          if (message.message_type === "video") {
            setInitializationError(`Failed to parse video content: ${error}`);
            console.error("Video message initialization failed:", error, diagnostics);
          }
        }
        
        // Try audio content next if no video data was found
        try {
          const contentObj = JSON.parse(message.content);
          
          if (contentObj.audioData) {
            console.log("Processing audio data from message content");
            try {
              // Create a Blob URL for the audio player
              const audioBlob = base64ToBlob(contentObj.audioData, 'audio/webm');
              const url = URL.createObjectURL(audioBlob);
              
              console.log("Created audio blob URL:", url);
              console.log("Audio blob size:", audioBlob.size);
              setAudioUrl(url);
              setAudioBase64(contentObj.audioData);
              setAudioBlob(audioBlob);
              
              // Check for additional text
              if (contentObj.additionalText) {
                console.log("Found additional text with audio:", contentObj.additionalText.substring(0, 50));
                setAdditionalText(contentObj.additionalText);
              }
              
              setHasInitialized(true);
            } catch (e) {
              console.error("Error creating blob from audio data:", e);
              setInitializationError(`Failed to create audio blob: ${e}`);
            }
          }
        } catch (e) {
          // Not JSON or error parsing audio content
          console.log("Failed to parse audio content:", e);
          
          if (message.message_type === "audio") {
            setInitializationError(`Failed to parse audio content: ${e}`);
            console.error("Audio message initialization failed:", e);
          }
        }
        
        // If it's a text message or we couldn't find media data, treat the content as text
        if (message.message_type === "text" || (!videoUrl && !audioUrl)) {
          console.log("Treating content as text message");
          setAdditionalText(message.content);
          setHasInitialized(true);
        }
      }
    } catch (e) {
      console.error("Error initializing media content:", e);
      setInitializationError(`General initialization error: ${e}`);
    }
    
    // Cleanup function to revoke object URLs when unmounting
    return () => {
      if (audioUrl) {
        console.log("Revoking audio URL on cleanup");
        URL.revokeObjectURL(audioUrl);
      }
      if (videoUrl) {
        console.log("Revoking video URL on cleanup");
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [message]);
  
  return {
    audioUrl,
    audioBase64,
    audioBlob,
    videoUrl,
    videoBase64,
    videoBlob,
    hasInitialized,
    additionalText,
    initializationError
  };
}
