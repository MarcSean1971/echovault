
import { blobToBase64 } from "@/utils/mediaUtils";

/**
 * Hook for processing audio data and content
 */
export function useAudioProcessor() {
  // Format audio content
  const formatAudioContent = async (blob: Blob): Promise<string> => {
    const base64 = await blobToBase64(blob);
    return JSON.stringify({
      audioData: base64,
      timestamp: new Date().toISOString()
    });
  };

  return {
    formatAudioContent
  };
}
