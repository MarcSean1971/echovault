
import { useState, useCallback } from "react";

export function useVideoStorage() {
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  
  // Function to clear recorded video with improved cleanup
  const clearVideo = useCallback((videoUrl: string | null, setVideoBlob: (blob: Blob | null) => void, setVideoUrl: (url: string | null) => void) => {
    console.log("Clearing video...");
    if (videoUrl) {
      try {
        URL.revokeObjectURL(videoUrl);
        console.log("Revoked video URL:", videoUrl.substring(0, 30) + "...");
      } catch (e) {
        console.warn("Failed to revoke video URL:", e);
      }
    }
    setVideoBlob(null);
    setVideoUrl(null);
    console.log("Video cleared successfully");
  }, []);
  
  // Function to restore video from blob and url with improved error handling and debugging
  const restoreVideo = useCallback((blob: Blob, url: string, setVideoBlob: (blob: Blob) => void, setVideoUrl: (url: string) => void) => {
    if (!blob || blob.size === 0) {
      console.error("Cannot restore video: Invalid blob", blob);
      return;
    }
    
    console.log("Restoring video from blob:", blob.size, "bytes, type:", blob.type);
    console.log("Original URL:", url.substring(0, 30) + "...");
    
    try {
      // First set the blob so we have the data
      setVideoBlob(blob);
      
      // Create a fresh URL to avoid stale references
      const freshUrl = URL.createObjectURL(blob);
      console.log("Created fresh URL:", freshUrl.substring(0, 30) + "...");
      
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
      setVideoUrl(freshUrl);
      console.log("Video restored successfully with fresh URL");
    } catch (error) {
      console.error("Error in restoreVideo:", error);
      
      // Try one more time with a fallback approach if there was an error
      try {
        // Fallback to just using the original URL
        setVideoUrl(url);
        console.log("Video restoration fell back to original URL");
      } catch (e) {
        console.error("Video restoration failed completely:", e);
      }
    }
  }, []);
  
  return {
    showVideoRecorder,
    setShowVideoRecorder,
    clearVideo,
    restoreVideo
  };
}
