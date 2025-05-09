
import { useState } from "react";

export function useVideoStorage() {
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  
  // Function to clear recorded video
  const clearVideo = (videoUrl: string | null, setVideoBlob: (blob: Blob | null) => void, setVideoUrl: (url: string | null) => void) => {
    console.log("Clearing video...");
    if (videoUrl) {
      try {
        URL.revokeObjectURL(videoUrl);
        console.log("Revoked video URL");
      } catch (e) {
        console.warn("Failed to revoke video URL:", e);
      }
    }
    setVideoBlob(null);
    setVideoUrl(null);
    console.log("Video cleared");
  };
  
  // Function to restore video from blob and url
  const restoreVideo = (blob: Blob, url: string, setVideoBlob: (blob: Blob) => void, setVideoUrl: (url: string) => void) => {
    console.log("Restoring video from blob:", blob.size, "bytes");
    
    // Create a fresh URL to avoid stale references
    const freshUrl = URL.createObjectURL(blob);
    
    // Set the blob first, then the URL
    setVideoBlob(blob);
    
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
    console.log("Video restored successfully with fresh URL:", freshUrl);
  };
  
  return {
    showVideoRecorder,
    setShowVideoRecorder,
    clearVideo,
    restoreVideo
  };
}
