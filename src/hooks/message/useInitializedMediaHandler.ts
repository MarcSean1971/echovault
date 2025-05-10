
import { Message } from "@/types/message";

/**
 * Hook to handle initialized media from existing messages
 */
export function useInitializedMediaHandler() {
  // Handle initialized video from existing message with enhanced reliability
  const handleInitializedVideo = (
    blob: Blob, 
    url: string, 
    setInitializedFromMessage: (value: boolean) => void,
    restoreVideo: (blob: Blob, url: string) => void
  ) => {
    console.log("handleInitializedVideo called with blob size:", blob.size, 
                "blob type:", blob.type,
                "url:", url.substring(0, 30) + "...");
    
    if (!blob || blob.size === 0) {
      console.error("Invalid video blob received in handleInitializedVideo");
      return;
    }
    
    try {
      // First restore the video to ensure it's displayed
      restoreVideo(blob, url);
      console.log("Video restored successfully in handleInitializedVideo");
      
      // Force a small delay before setting the flag to ensure the UI has updated
      setTimeout(() => {
        setInitializedFromMessage(true);
        console.log("Video initialization flag set to true after forced delay");
        
        // Dispatch a custom event to notify components that video is ready
        try {
          const videoReadyEvent = new CustomEvent('video-initialization-complete', {
            detail: { url, blobSize: blob.size }
          });
          window.dispatchEvent(videoReadyEvent);
          console.log("Dispatched video-initialization-complete event");
        } catch (eventError) {
          console.error("Error dispatching video ready event:", eventError);
        }
      }, 50);
    } catch (error) {
      console.error("Error in handleInitializedVideo:", error);
      
      // Try one more time with a longer delay
      setTimeout(() => {
        try {
          console.log("Retrying video restoration after error");
          restoreVideo(blob, url);
          setInitializedFromMessage(true);
        } catch (retryError) {
          console.error("Retry attempt also failed:", retryError);
        }
      }, 500);
    }
  };

  // Handle initialized audio from existing message with improved reliability
  const handleInitializedAudio = (
    blob: Blob, 
    url: string, 
    setInitializedFromMessage: (value: boolean) => void,
    restoreAudio: (blob: Blob, url: string) => void
  ) => {
    console.log("handleInitializedAudio with blob size:", blob.size, 
                "blob type:", blob.type,
                "url:", url.substring(0, 30) + "...");
    
    if (!blob || blob.size === 0) {
      console.error("Invalid audio blob received in handleInitializedAudio");
      return;
    }
    
    try {
      // First restore the audio to ensure it's displayed
      restoreAudio(blob, url);
      console.log("Audio restored successfully in handleInitializedAudio");
      
      // Force a small delay before setting the flag to ensure the UI has updated
      setTimeout(() => {
        setInitializedFromMessage(true);
        console.log("Audio initialization flag set to true after forced delay");
        
        // Dispatch a custom event to notify components that audio is ready
        try {
          const audioReadyEvent = new CustomEvent('audio-initialization-complete', {
            detail: { url, blobSize: blob.size }
          });
          window.dispatchEvent(audioReadyEvent);
          console.log("Dispatched audio-initialization-complete event");
        } catch (eventError) {
          console.error("Error dispatching audio ready event:", eventError);
        }
      }, 50);
    } catch (error) {
      console.error("Error in handleInitializedAudio:", error);
      
      // Try one more time with a longer delay
      setTimeout(() => {
        try {
          console.log("Retrying audio restoration after error");
          restoreAudio(blob, url);
          setInitializedFromMessage(true);
        } catch (retryError) {
          console.error("Retry attempt also failed:", retryError);
        }
      }, 500);
    }
  };

  return {
    handleInitializedVideo,
    handleInitializedAudio
  };
}
