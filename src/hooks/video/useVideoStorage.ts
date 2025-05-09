
import { useState } from "react";

export function useVideoStorage() {
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  
  // Function to clear recorded video
  const clearVideo = (videoUrl: string | null, setVideoBlob: (blob: Blob | null) => void, setVideoUrl: (url: string | null) => void) => {
    console.log("Clearing video...");
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoBlob(null);
    setVideoUrl(null);
    console.log("Video cleared");
  };
  
  // Function to restore video from blob and url
  const restoreVideo = (blob: Blob, url: string, setVideoBlob: (blob: Blob) => void, setVideoUrl: (url: string) => void) => {
    console.log("Restoring video from blob:", blob.size, "bytes");
    setVideoBlob(blob);
    setVideoUrl(url);
    console.log("Video restored");
  };
  
  return {
    showVideoRecorder,
    setShowVideoRecorder,
    clearVideo,
    restoreVideo
  };
}
