
import { useEffect } from "react";
import { Message } from "@/types/message";

/**
 * Hook to handle initialized media from existing messages
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
  // Connect initialized video/audio data to our message type manager
  useEffect(() => {
    if (!hasInitialized) {
      console.log("MediaInitializer: Waiting for initialization");
      return;
    }

    console.log("MediaInitializer: Status check", {
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
    
    // Flag to prevent double-initialization
    let didInitialize = false;
    
    // Handle video initialization with priority
    if (initialVideoBlob && initialVideoUrl && !initializedFromMessage) {
      console.log("MediaInitializer: Initializing video with blob size:", initialVideoBlob.size);
      
      // Process immediately without delay or initialization checks
      try {
        handleInitializedVideo(initialVideoBlob, initialVideoUrl);
        console.log("MediaInitializer: Video initialization processed immediately");
        setInitializedFromMessage(true);
        didInitialize = true;
      } catch (err) {
        console.error("MediaInitializer: Error initializing video:", err);
      }
    }
    // Handle audio initialization
    else if (initialAudioBlob && initialAudioUrl && !initializedFromMessage && !didInitialize) {
      console.log("MediaInitializer: Initializing audio with blob size:", initialAudioBlob.size);
      
      try {
        handleInitializedAudio(initialAudioBlob, initialAudioUrl);
        console.log("MediaInitializer: Audio initialization processed immediately");
        setInitializedFromMessage(true);
      } catch (err) {
        console.error("MediaInitializer: Error initializing audio:", err);
      }
    }
    else if (!initialVideoBlob && !initialAudioBlob) {
      console.log("MediaInitializer: No media to initialize");
    }
    else if (initializedFromMessage) {
      console.log("MediaInitializer: Already initialized from message");
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
