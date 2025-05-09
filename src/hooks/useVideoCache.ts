
import { useState } from "react";

export function useVideoCache() {
  // Add state to store video info when switching tabs
  const [cachedVideoBlob, setCachedVideoBlob] = useState<Blob | null>(null);
  const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null);
  
  // Cache and restore video functions
  const cacheVideo = (blob: Blob | null, url: string | null) => {
    if (blob && url) {
      console.log("Caching video", blob.size, "bytes");
      setCachedVideoBlob(blob);
      setCachedVideoUrl(url);
      return true;
    }
    return false;
  };
  
  const clearCache = () => {
    if (cachedVideoUrl) {
      URL.revokeObjectURL(cachedVideoUrl);
    }
    setCachedVideoBlob(null);
    setCachedVideoUrl(null);
  };
  
  return {
    cachedVideoBlob,
    cachedVideoUrl,
    cacheVideo,
    clearCache
  };
}
