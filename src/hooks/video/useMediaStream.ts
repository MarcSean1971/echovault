
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export function useMediaStream() {
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Function to stop media stream
  const stopMediaStream = () => {
    if (streamRef.current) {
      console.log("Stopping media stream tracks...");
      streamRef.current.getTracks().forEach(track => {
        console.log("Stopping track:", track.kind, track.readyState);
        track.stop();
      });
      
      // Important: Clear both the ref and the state
      streamRef.current = null;
      setPreviewStream(null);
      console.log("Media stream stopped and state cleared");
    } else {
      console.log("No media stream to stop");
    }
  };

  // Check if the stream is actually active (not stopped)
  const isStreamActive = () => {
    if (!streamRef.current) return false;
    
    // Check if all tracks are active
    const allTracks = streamRef.current.getTracks();
    const activeTracks = allTracks.filter(track => track.readyState === "live");
    
    return activeTracks.length > 0 && activeTracks.length === allTracks.length;
  };

  // Initialize the media stream for preview before recording
  const initializeStream = async (forceNew = false) => {
    try {
      // If we already have an active stream and don't need to force new, return it
      if (!forceNew && streamRef.current && isStreamActive()) {
        console.log("Reusing existing active stream");
        return streamRef.current;
      }
      
      setIsInitializing(true);
      console.log("Initializing camera for preview...");
      
      // Always stop any existing stream first
      stopMediaStream();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true
      });
      
      console.log("Camera preview initialized successfully");
      streamRef.current = stream;
      setPreviewStream(stream);
      setHasPermission(true);
      return stream;
    } catch (error: any) {
      console.error("Error initializing camera:", error);
      setHasPermission(false);
      
      // More specific error messages based on common issues
      let errorMessage = "Error accessing camera or microphone";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Camera or microphone access was denied. Please check your browser permissions.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Camera or microphone not found. Please check your device.";
      } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
        errorMessage = "Could not access your camera or microphone. It might be in use by another application.";
      } else if (error.name === 'SecurityError') {
        errorMessage = "Media access is not allowed in this context. Please check your settings.";
      }
      
      toast({
        title: "Permission Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw new Error(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  // Clean up video stream when component unmounts
  useEffect(() => {
    return () => {
      stopMediaStream();
    };
  }, []);

  return {
    previewStream,
    isInitializing,
    hasPermission,
    streamRef,
    initializeStream,
    stopMediaStream,
    isStreamActive
  };
}
