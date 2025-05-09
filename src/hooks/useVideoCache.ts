
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
      return true;
    }
    return false;
  };
  
  const clearCache = () => {
    if (cachedVideoUrl) {
      URL.revokeObjectURL(cachedVideoUrl);
    }
    console.log("Clearing video cache");
    setCachedVideoBlob(null);
    setCachedVideoUrl(null);
    setCachedTranscription(null);
  };
  
  return {
    cachedVideoBlob,
    cachedVideoUrl,
    cachedTranscription,
    cacheVideo,
    clearCache
  };
}
