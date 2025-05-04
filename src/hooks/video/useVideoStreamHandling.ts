
import { useState, useCallback, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

interface UseVideoStreamHandlingProps {
  videoPreviewRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
}

export function useVideoStreamHandling({ 
  videoPreviewRef, 
  stream 
}: UseVideoStreamHandlingProps) {
  const [streamReady, setStreamReady] = useState(false);
  
  // Improved stream connection to video element with better readiness detection
  useEffect(() => {
    if (stream && videoPreviewRef.current) {
      console.log("Connecting stream to video element");
      
      // Set stream to video element
      videoPreviewRef.current.srcObject = stream;
      
      // Create a more reliable way to check readiness
      const checkStreamActive = () => {
        if (!videoPreviewRef.current) return;
        
        const videoElem = videoPreviewRef.current;
        
        // Multiple checks to confirm stream is truly ready
        const isVideoPlaying = 
          !videoElem.paused && 
          !videoElem.ended && 
          videoElem.currentTime > 0 &&
          videoElem.readyState >= 2; // HAVE_CURRENT_DATA or better
          
        const hasActiveStream = 
          videoElem.srcObject instanceof MediaStream && 
          (videoElem.srcObject as MediaStream).active &&
          (videoElem.srcObject as MediaStream).getVideoTracks().length > 0 &&
          (videoElem.srcObject as MediaStream).getVideoTracks()[0].readyState === 'live';
        
        const isReady = isVideoPlaying && hasActiveStream;
        console.log("Stream active check:", isReady, "Video playing:", isVideoPlaying, "Has active stream:", hasActiveStream);
        
        if (isReady) {
          setStreamReady(true);
        }
      };
      
      // Check immediately and also set up event listeners
      videoPreviewRef.current.onloadedmetadata = () => {
        console.log("Video element loaded stream metadata");
        if (videoPreviewRef.current) {
          videoPreviewRef.current.play()
            .then(() => {
              console.log("Video preview playing successfully");
              // Use a short delay to let the video truly start playing
              setTimeout(checkStreamActive, 100);
              setTimeout(checkStreamActive, 500);
              setTimeout(checkStreamActive, 1000);
            })
            .catch(err => {
              console.error("Error playing stream in video element:", err);
              setStreamReady(false);
            });
        }
      };
      
      // Additional event listeners to check stream readiness
      videoPreviewRef.current.addEventListener('playing', checkStreamActive);
      videoPreviewRef.current.addEventListener('timeupdate', checkStreamActive);
      
      // Clean up
      return () => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.removeEventListener('playing', checkStreamActive);
          videoPreviewRef.current.removeEventListener('timeupdate', checkStreamActive);
        }
      };
    } else {
      setStreamReady(false);
    }
  }, [stream]);
  
  return { streamReady };
}
