
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
    console.log("handleInitializedVideo with blob size:", blob.size, "url:", url.substring(0, 30) + "...");
    // Set the flag first, then restore the video to ensure proper state transition
    setInitializedFromMessage(true);
    
    // Use setTimeout to ensure the flag is set before we restore the video
    // This fixes timing issues where the video was being initialized before state updates completed
    setTimeout(() => {
      console.log("Restoring video after initialization flag was set");
      restoreVideo(blob, url);
    }, 0);
  };

  // Handle initialized audio from existing message
  const handleInitializedAudio = (
    blob: Blob, 
    url: string, 
    setInitializedFromMessage: (value: boolean) => void,
    restoreAudio: (blob: Blob, url: string) => void
  ) => {
    console.log("handleInitializedAudio with blob size:", blob.size, "url:", url.substring(0, 30) + "...");
    // Set the flag first, then restore the audio to ensure proper state transition
    setInitializedFromMessage(true);
    
    // Use setTimeout to ensure the flag is set before we restore the audio
    // This fixes timing issues where the audio was being initialized before state updates completed
    setTimeout(() => {
      console.log("Restoring audio after initialization flag was set");
      restoreAudio(blob, url);
    }, 0);
  };

  return {
    handleInitializedVideo,
    handleInitializedAudio
  };
}
