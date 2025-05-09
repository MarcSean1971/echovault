
import { useState } from "react";

export function useAudioStorage() {
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  
  // Function to clear recorded audio
  const clearAudio = (audioUrl: string | null, setAudioBlob: (blob: Blob | null) => void, setAudioUrl: (url: string | null) => void) => {
    console.log("Clearing audio...");
    if (audioUrl) {
      try {
        URL.revokeObjectURL(audioUrl);
        console.log("Revoked audio URL");
      } catch (e) {
        console.warn("Failed to revoke audio URL:", e);
      }
    }
    setAudioBlob(null);
    setAudioUrl(null);
    console.log("Audio cleared");
  };
  
  // Function to restore audio from blob and url
  const restoreAudio = (blob: Blob, url: string, setAudioBlob: (blob: Blob) => void, setAudioUrl: (url: string) => void) => {
    console.log("Restoring audio from blob:", blob.size, "bytes");
    
    // Create a fresh URL to avoid stale references
    const freshUrl = URL.createObjectURL(blob);
    
    // Set the blob first, then the URL
    setAudioBlob(blob);
    
    // If the passed URL is different from the fresh one, revoke the old one
    if (url !== freshUrl && url) {
      try {
        URL.revokeObjectURL(url);
        console.log("Revoked old URL during restoration");
      } catch (e) {
        console.warn("Could not revoke old URL:", e);
      }
    }
    
    // Set the fresh URL
    setAudioUrl(freshUrl);
    console.log("Audio restored successfully with fresh URL:", freshUrl);
  };
  
  return {
    showAudioRecorder,
    setShowAudioRecorder,
    clearAudio,
    restoreAudio
  };
}
