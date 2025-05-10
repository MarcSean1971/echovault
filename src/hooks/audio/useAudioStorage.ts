
import { useState, useCallback } from "react";
import { safeCreateObjectURL, safeRevokeObjectURL } from "@/utils/mediaUtils";

export function useAudioStorage() {
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  
  // Simplified function to clear audio
  const clearAudio = useCallback((
    audioUrl: string | null, 
    setAudioBlob: (blob: Blob | null) => void, 
    setAudioUrl: (url: string | null) => void
  ) => {
    console.log("Clearing audio...");
    
    // Revoke URL if it exists to prevent memory leaks
    if (audioUrl) {
      try {
        safeRevokeObjectURL(audioUrl);
      } catch (e) {
        console.warn("Failed to revoke audio URL:", e);
      }
    }
    
    // Reset state
    setAudioBlob(null);
    setAudioUrl(null);
    console.log("Audio cleared successfully");
  }, []);
  
  // Simplified function to restore audio from blob
  const restoreAudio = useCallback((
    blob: Blob,
    url: string,
    setAudioBlob: (blob: Blob) => void, 
    setAudioUrl: (url: string) => void
  ) => {
    if (!blob || blob.size === 0) {
      console.error("Cannot restore audio: Invalid blob");
      return;
    }
    
    console.log("Restoring audio from blob:", blob.size, "bytes");
    
    try {
      // Set the blob first
      setAudioBlob(blob);
      
      // Create a fresh URL from the blob
      const freshUrl = safeCreateObjectURL(blob) || url;
      
      // Set the URL
      setAudioUrl(freshUrl);
      console.log("Audio restored successfully with URL:", freshUrl.substring(0, 30) + "...");
    } catch (error) {
      console.error("Error in restoreAudio:", error);
      
      // Use the original URL as fallback
      setAudioBlob(blob);
      setAudioUrl(url);
      console.log("Using original URL as fallback");
    }
  }, []);
  
  return {
    showAudioRecorder,
    setShowAudioRecorder,
    clearAudio,
    restoreAudio
  };
}
