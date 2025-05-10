
import { Message } from "@/types/message";

/**
 * Hook to handle initialized media from existing messages
 */
export function useInitializedMediaHandler() {
  // Handle initialized video from existing message
  const handleInitializedVideo = (
    blob: Blob, 
    url: string, 
    setInitializedFromMessage: (value: boolean) => void,
    restoreVideo: (blob: Blob, url: string) => void
  ) => {
    console.log("handleInitializedVideo with blob size:", blob.size);
    setInitializedFromMessage(true);
    restoreVideo(blob, url);
  };

  // Handle initialized audio from existing message
  const handleInitializedAudio = (
    blob: Blob, 
    url: string, 
    setInitializedFromMessage: (value: boolean) => void,
    restoreAudio: (blob: Blob, url: string) => void
  ) => {
    console.log("handleInitializedAudio with blob size:", blob.size);
    setInitializedFromMessage(true);
    restoreAudio(blob, url);
  };

  return {
    handleInitializedVideo,
    handleInitializedAudio
  };
}
