
import { useState } from "react";
import { useAudioStorage } from "./useAudioStorage";
import { useAudioProcessor } from "./useAudioProcessor";

/**
 * Hook for managing audio storage and state
 */
export function useAudioStorageManager(setContent: (content: string) => void, setAudioContent: (content: string) => void) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { formatAudioContent } = useAudioProcessor();
  
  const {
    showAudioRecorder,
    setShowAudioRecorder,
    clearAudio: clearAudioBase,
    restoreAudio: restoreAudioBase
  } = useAudioStorage();
  
  // Wrapper function for clearAudio
  const clearAudio = (isRecording: boolean, stopRecording: () => void, cleanupResources: () => void, isStreamActive: () => boolean, stopMediaStream: () => void) => {
    console.log("useAudioStorageManager: Clearing audio");
    
    // First stop recording if it's ongoing
    if (isRecording) {
      try {
        stopRecording();
      } catch (e) {
        console.error("Error stopping recording while clearing:", e);
      }
    }
    
    clearAudioBase(audioUrl, setAudioBlob, setAudioUrl);
    
    // Clean up recorder resources
    cleanupResources();
    
    // Clear the audioContent in the form context
    setAudioContent("");
    
    // Stop any active audio streams when clearing
    if (isStreamActive()) {
      stopMediaStream();
    }
  };
  
  // Wrapper function for restoreAudio
  const restoreAudio = async (blob: Blob, url: string) => {
    console.log("useAudioStorageManager: Restoring audio", { 
      hasBlob: !!blob, 
      hasUrl: !!url, 
      blobSize: blob?.size || 0
    });
    
    restoreAudioBase(blob, url, setAudioBlob, setAudioUrl);
    
    // If we have a blob, restore it in the content
    if (blob) {
      try {
        // Format the audio content for the form
        const formattedContent = await formatAudioContent(blob);
        setAudioContent(formattedContent);
        setContent(formattedContent);
      } catch (err) {
        console.error("Error restoring audio content:", err);
      }
    }
  };

  return {
    audioBlob,
    audioUrl,
    setAudioBlob,
    setAudioUrl,
    showAudioRecorder,
    setShowAudioRecorder,
    clearAudio,
    restoreAudio
  };
}
