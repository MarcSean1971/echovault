
import { useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface UseVideoInitializationProps {
  initStream: () => Promise<MediaStream | null>;
  resetStream: () => void;
  stream: MediaStream | null;
}

export function useVideoInitialization({ 
  initStream, 
  resetStream,
  stream
}: UseVideoInitializationProps) {
  // Function to initialize the stream with better error handling
  const initializeStream = useCallback(async () => {
    console.log("Explicitly initializing video stream");
    try {
      toast({
        title: "Connecting to camera",
        description: "Please allow camera access if prompted",
      });
      
      const newStream = await initStream();
      
      // Give the stream time to properly initialize before concluding
      if (newStream) {
        console.log("Video stream initialized, waiting for video element to connect");
        return true;
      } else {
        throw new Error("Failed to initialize video stream");
      }
    } catch (err) {
      console.error("Failed to initialize video stream:", err);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions and try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [initStream]);
  
  // Function to reinitialize the stream if needed
  const reinitializeStream = useCallback(async () => {
    console.log("Reinitializing video stream");
    resetStream();
    
    return initializeStream();
  }, [initializeStream, resetStream]);

  return {
    initializeStream,
    reinitializeStream
  };
}
