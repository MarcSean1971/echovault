
import { useState, useCallback } from "react";
import { safeCreateObjectURL, safeRevokeObjectURL } from "@/utils/mediaUtils";

export function useVideoStorage() {
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  
  // Function to clear recorded video with improved cleanup
  const clearVideo = useCallback((videoUrl: string | null, setVideoBlob: (blob: Blob | null) => void, setVideoUrl: (url: string | null) => void) => {
    console.log("Clearing video...");
    if (videoUrl) {
      try {
        safeRevokeObjectURL(videoUrl);
        console.log("Revoked video URL:", videoUrl.substring(0, 30) + "...");
      } catch (e) {
        console.warn("Failed to revoke video URL:", e);
      }
    }
    setVideoBlob(null);
    setVideoUrl(null);
    console.log("Video cleared successfully");
  }, []);
  
  // Function to restore video from blob and url with improved error handling
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
      
      // Always create a fresh URL to avoid stale references
      let freshUrl: string;
      try {
        // Try to create a URL for the blob
        freshUrl = safeCreateObjectURL(blob) || url;
        console.log("Created fresh URL:", freshUrl.substring(0, 30) + "...");
      } catch (e) {
        console.error("Failed to create fresh URL:", e);
        
        // Try an alternative approach if the first fails
        try {
          // Create a new blob from the existing one with explicit type
          const newBlob = new Blob([blob], { type: blob.type || 'video/webm' });
          freshUrl = URL.createObjectURL(newBlob);
          console.log("Created URL with new blob:", freshUrl.substring(0, 30) + "...");
        } catch (e2) {
          console.error("Failed to create URL even with new blob:", e2);
          freshUrl = url; // Fallback to original URL
          console.log("Using original URL as fallback");
        }
      }
      
      // If the passed URL is different from the fresh one, revoke the old one
      if (url !== freshUrl && url) {
        try {
          safeRevokeObjectURL(url);
          console.log("Revoked old URL during restoration");
        } catch (e) {
          console.warn("Could not revoke old URL:", e);
        }
      }
      
      // First, log what we're about to do
      console.log(`About to set video URL to: ${freshUrl.substring(0, 30)}...`);
      
      // Set the URL and immediately verify it was set correctly
      setVideoUrl(freshUrl);
      
      // Force call an immediate setTimeout to verify the URL was set
      setTimeout(() => {
        console.log("Verification check: Video URL should now be set to:", freshUrl.substring(0, 30) + "...");
        
        // Trigger a custom event to ensure components know the video URL has been updated
        try {
          const videoUrlUpdateEvent = new CustomEvent('video-url-updated', { 
            detail: { url: freshUrl, blobSize: blob.size } 
          });
          window.dispatchEvent(videoUrlUpdateEvent);
          console.log("Dispatched video-url-updated event");
        } catch (eventError) {
          console.error("Error dispatching video URL update event:", eventError);
        }
      }, 0);
    } catch (error) {
      console.error("Error in restoreVideo:", error);
      
      // Try one more time with a fallback approach
      try {
        console.log("Attempting fallback video restoration with original URL");
        setVideoUrl(url);
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
