
import { useCallback } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { blobToBase64 } from "@/utils/mediaUtils";

/**
 * Hook for updating different content types in the message form
 */
export function useContentUpdater() {
  const { setVideoContent, setAudioContent } = useMessageForm();
  
  // Update video content
  const handleVideoContentUpdate = useCallback(async (blob: Blob) => {
    try {
      console.log("Converting video blob to base64...");
      const base64 = await blobToBase64(blob);
      
      console.log("Setting video content in form");
      const content = JSON.stringify({
        videoData: base64,
        timestamp: new Date().toISOString()
      });
      
      setVideoContent(content);
    } catch (error) {
      console.error("Error updating video content:", error);
    }
  }, [setVideoContent]);
  
  // Update audio content
  const handleAudioContentUpdate = useCallback(async (blob: Blob) => {
    try {
      console.log("Converting audio blob to base64...");
      const base64 = await blobToBase64(blob);
      
      console.log("Setting audio content in form");
      const content = JSON.stringify({
        audioData: base64,
        timestamp: new Date().toISOString()
      });
      
      setAudioContent(content);
      return true;
    } catch (error) {
      console.error("Error updating audio content:", error);
      return false;
    }
  }, [setAudioContent]);

  return {
    handleVideoContentUpdate,
    handleAudioContentUpdate
  };
}
