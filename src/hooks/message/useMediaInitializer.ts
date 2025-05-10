
import { useEffect } from "react";
import { Message } from "@/types/message";

/**
 * Hook to handle initialized media from existing messages
 * Prioritizes showing existing video/audio when editing a message
 */
export function useMediaInitializer(
  message: Message | undefined,
  initialVideoBlob: Blob | null,
  initialVideoUrl: string | null,
  initialAudioBlob: Blob | null, 
  initialAudioUrl: string | null,
  hasInitialized: boolean,
  initializedFromMessage: boolean,
  setInitializedFromMessage: (value: boolean) => void,
  handleInitializedVideo: (blob: Blob, url: string) => void,
  handleInitializedAudio: (blob: Blob, url: string) => void
) {
  // Connect initialized video/audio data to our message type manager with priority for existing content
  useEffect(() => {
    if (!hasInitialized) {
      console.log("MediaInitializer: Waiting for initialization");
      return;
    }

    console.log("MediaInitializer: Checking for existing media content", {
      hasInitialized,
      hasVideoBlob: !!initialVideoBlob,
      videoBlob: initialVideoBlob ? `${initialVideoBlob.size} bytes` : null,
      hasVideoUrl: !!initialVideoUrl,
      videoUrl: initialVideoUrl ? `${initialVideoUrl.substring(0, 30)}...` : null,
      hasAudioBlob: !!initialAudioBlob, 
      hasAudioUrl: !!initialAudioUrl,
      initializedFromMessage,
      messageType: message?.message_type
    });
    
    // Immediately initialize existing video content without any delays or complex checks
    if (initialVideoBlob && initialVideoUrl && !initializedFromMessage) {
      console.log("MediaInitializer: Initializing existing video content immediately");
      try {
        handleInitializedVideo(initialVideoBlob, initialVideoUrl);
        setInitializedFromMessage(true);
      } catch (err) {
        console.error("MediaInitializer: Error initializing video:", err);
      }
      return; // Exit early after handling video
    }
    
    // Handle audio initialization only if no video was found
    if (initialAudioBlob && initialAudioUrl && !initializedFromMessage) {
      console.log("MediaInitializer: Initializing existing audio content");
      try {
        handleInitializedAudio(initialAudioBlob, initialAudioUrl);
        setInitializedFromMessage(true);
      } catch (err) {
        console.error("MediaInitializer: Error initializing audio:", err);
      }
    }
  }, [
    hasInitialized, 
    initialVideoBlob, 
    initialVideoUrl, 
    initialAudioBlob, 
    initialAudioUrl, 
    handleInitializedVideo, 
    handleInitializedAudio, 
    initializedFromMessage, 
    setInitializedFromMessage,
    message
  ]);

  return {
    mediaInitialized: initializedFromMessage
  };
}
