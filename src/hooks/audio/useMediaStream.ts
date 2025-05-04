
import { useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { stopMediaTracks } from "./audioUtils";

/**
 * Manages access to audio media stream
 */
export function useMediaStream() {
  const requestMediaStream = useCallback(async () => {
    console.log("Requesting microphone access...");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Got audio stream:", stream);
      return { stream, error: null };
    } catch (err: any) {
      console.error("Error accessing media stream:", err);
      
      // Check if it's a permission denial
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast({
          title: "Permission Denied",
          description: "Microphone access was denied. Please grant permission to use the recorder.",
          variant: "destructive"
        });
        return { stream: null, error: "permission_denied" };
      } else {
        toast({
          title: "Recording Failed",
          description: "Could not start recording: " + (err.message || "Unknown error"),
          variant: "destructive"
        });
        return { stream: null, error: "other_error" };
      }
    }
  }, []);
  
  const closeMediaStream = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stopMediaTracks(stream);
      console.log("Media stream tracks stopped");
    }
  }, []);
  
  return {
    requestMediaStream,
    closeMediaStream
  };
}
