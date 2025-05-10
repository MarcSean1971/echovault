
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
    if (hasInitialized && initialVideoBlob && initialVideoUrl && !initializedFromMessage) {
      console.log("MessageMediaInitializer: Connecting initialized video to message type manager");
      console.log("Initial video blob size:", initialVideoBlob.size);
      
      // Set the flag first to prevent double initialization
      setInitializedFromMessage(true);
      handleInitializedVideo(initialVideoBlob, initialVideoUrl);
    }
  }, [hasInitialized, initialVideoBlob, initialVideoUrl, handleInitializedVideo, initializedFromMessage, setInitializedFromMessage]);

  // Connect initialized audio data to our message type manager
  useEffect(() => {
    if (hasInitialized && initialAudioBlob && initialAudioUrl && !initializedFromMessage) {
      console.log("MessageMediaInitializer: Connecting initialized audio to message type manager");
      console.log("Initial audio blob size:", initialAudioBlob.size);
      
      // Set the flag first to prevent double initialization
      setInitializedFromMessage(true);
      handleInitializedAudio(initialAudioBlob, initialAudioUrl);
    }
  }, [hasInitialized, initialAudioBlob, initialAudioUrl, handleInitializedAudio, initializedFromMessage, setInitializedFromMessage]);

  return {
    mediaInitialized: initializedFromMessage
  };
}
