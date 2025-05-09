
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
      setCachedVideoBlob(blob);
      setCachedVideoUrl(url);
      setCachedTranscription(transcription);
      console.log("Video successfully cached");
      return true;
    }
    console.log("Failed to cache video - missing blob or URL");
    return false;
  };
  
  const clearCache = () => {
    if (cachedVideoUrl) {
      console.log("Revoking cached video URL");
      URL.revokeObjectURL(cachedVideoUrl);
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
