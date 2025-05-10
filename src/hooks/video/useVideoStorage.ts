
import { useState, useCallback } from "react";
import { safeCreateObjectURL, safeRevokeObjectURL } from "@/utils/mediaUtils";

export function useVideoStorage() {
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  
  // Simplified function to clear video
  const clearVideo = useCallback((
    videoUrl: string | null, 
    setVideoBlob: (blob: Blob | null) => void, 
    setVideoUrl: (url: string | null) => void
  ) => {
    console.log("Clearing video...");
    
    // Revoke URL if it exists to prevent memory leaks
    if (videoUrl) {
      try {
        safeRevokeObjectURL(videoUrl);
      } catch (e) {
        console.warn("Failed to revoke video URL:", e);
      }
    }
    
    // Reset state
    setVideoBlob(null);
    setVideoUrl(null);
    console.log("Video cleared successfully");
  }, []);
  
  // Simplified function to restore video from blob
  const restoreVideo = useCallback((
    blob: Blob, 
    url: string,
    setVideoBlob: (blob: Blob) => void, 
    setVideoUrl: (url: string) => void
  ) => {
    if (!blob || blob.size === 0) {
      console.error("Cannot restore video: Invalid blob");
      return;
    }
    
    console.log("Restoring video from blob:", blob.size, "bytes");
    
    try {
      // Set the blob first
      setVideoBlob(blob);
      
      // Create a fresh URL from the blob
      const freshUrl = safeCreateObjectURL(blob) || url;
      
      // Set the URL
      setVideoUrl(freshUrl);
      console.log("Video restored successfully with URL:", freshUrl.substring(0, 30) + "...");
    } catch (error) {
      console.error("Error in restoreVideo:", error);
      
      // Use the original URL as fallback
      setVideoBlob(blob);
      setVideoUrl(url);
      console.log("Using original URL as fallback");
    }
  }, []);
  
  return {
    showVideoRecorder,
    setShowVideoRecorder,
    clearVideo,
    restoreVideo
  };
}
