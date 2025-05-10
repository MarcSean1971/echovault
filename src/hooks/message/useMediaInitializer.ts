
import { useEffect } from "react";
import { Message } from "@/types/message";

/**
 * Hook to manage initialization of media content from an existing message
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
  // Connect initialized video data to our message type manager
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
      initializedFromMessage
    });
    
    // Handle video initialization
    if (initialVideoBlob && initialVideoUrl && !initializedFromMessage) {
      console.log("MediaInitializer: Connecting initialized video to message type manager");
      console.log("Initial video blob size:", initialVideoBlob.size);
      
      // Initialize the video with original blob and URL
      handleInitializedVideo(initialVideoBlob, initialVideoUrl);
    }
    
    // Handle audio initialization
    else if (initialAudioBlob && initialAudioUrl && !initializedFromMessage) {
      console.log("MediaInitializer: Connecting initialized audio to message type manager");
      console.log("Initial audio blob size:", initialAudioBlob.size);
      
      // Initialize the audio with original blob and URL
      handleInitializedAudio(initialAudioBlob, initialAudioUrl);
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
    setInitializedFromMessage
  ]);

  return {
    mediaInitialized: initializedFromMessage
  };
}
