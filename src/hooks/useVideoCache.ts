
import { useState } from "react";

export function useVideoCache() {
  // Add state to store video info when switching tabs
  const [cachedVideoBlob, setCachedVideoBlob] = useState<Blob | null>(null);
  const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null);
  const [cachedTranscription, setCachedTranscription] = useState<string | null>(null);
  
  // Cache and restore video functions
  const cacheVideo = (blob: Blob | null, url: string | null, transcription: string | null = null) => {
    console.log("Caching video data:", {
      blobSize: blob ? blob.size : 'none',
      hasUrl: !!url,
      transcription: transcription ? `${transcription.substring(0, 20)}...` : 'none'
    });
    
    if (blob && url) {
      // Create a fresh URL for the cached blob to avoid stale references
      const freshUrl = URL.createObjectURL(blob);
      
      // If previous cached URL exists, revoke it
      if (cachedVideoUrl) {
        try {
          URL.revokeObjectURL(cachedVideoUrl);
          console.log("Revoked previous cached URL");
        } catch (e) {
          console.warn("Could not revoke previous cached URL:", e);
        }
      }
      
      // Set cached values
      setCachedVideoBlob(blob);
      setCachedVideoUrl(freshUrl);
      setCachedTranscription(transcription);
      console.log("Video successfully cached with fresh URL:", freshUrl);
      return true;
    }
    console.log("Failed to cache video - missing blob or URL");
    return false;
  };
  
  const clearCache = () => {
    if (cachedVideoUrl) {
      console.log("Revoking cached video URL");
      try {
        URL.revokeObjectURL(cachedVideoUrl);
      } catch (e) {
        console.warn("Error revoking cached URL:", e);
      }
    }
    console.log("Clearing video cache");
    setCachedVideoBlob(null);
    setCachedVideoUrl(null);
    setCachedTranscription(null);
  };
  
  const hasCachedVideo = () => {
    return !!(cachedVideoBlob && cachedVideoUrl);
  };
  
  return {
    cachedVideoBlob,
    cachedVideoUrl,
    cachedTranscription,
    cacheVideo,
    clearCache,
    hasCachedVideo
  };
}
