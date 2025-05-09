
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
      streamRef.current.getTracks().forEach(track => {
        console.log("Stopping track:", track.kind);
        track.stop();
      });
      streamRef.current = null;
      setPreviewStream(null);
      console.log("Media stream stopped");
    }
  };

  // Initialize the media stream for preview before recording
  const initializeStream = async () => {
    try {
      setIsInitializing(true);
      console.log("Initializing camera for preview...");
      
      // Stop any existing stream first
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
    stopMediaStream
  };
}
