
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
      hasVideoUrl: !!initialVideoUrl,
      hasAudioBlob: !!initialAudioBlob, 
      hasAudioUrl: !!initialAudioUrl,
      initializedFromMessage,
      messageType: message?.message_type
    });
    
    // Skip if we've already initialized the content
    if (initializedFromMessage) {
      console.log("MediaInitializer: Already initialized from message, skipping");
      return;
    }
    
    // Handle video initialization
    if (initialVideoBlob && initialVideoUrl) {
      console.log("MediaInitializer: Connecting initialized video to message type manager");
      console.log("Initial video blob size:", initialVideoBlob.size);
      
      // Initialize the video with original blob and URL
      try {
        handleInitializedVideo(initialVideoBlob, initialVideoUrl);
        console.log("MediaInitializer: Video initialization complete");
      } catch (err) {
        console.error("MediaInitializer: Error initializing video:", err);
      }
    }
    
    // Handle audio initialization
    else if (initialAudioBlob && initialAudioUrl) {
      console.log("MediaInitializer: Connecting initialized audio to message type manager");
      console.log("Initial audio blob size:", initialAudioBlob.size);
      
      // Initialize the audio with original blob and URL
      try {
        handleInitializedAudio(initialAudioBlob, initialAudioUrl);
        console.log("MediaInitializer: Audio initialization complete");
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
