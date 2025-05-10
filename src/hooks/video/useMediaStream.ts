
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

interface MediaOptions {
  video?: boolean;
  audio?: boolean;
}

export function useMediaStream() {
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isUnmountedRef = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up unmount detection
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      stopMediaStream();
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  // Function to stop media stream
  const stopMediaStream = () => {
    if (streamRef.current) {
      console.log("Stopping media stream tracks...");
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          track.stop();
        });
        
        // Clear the ref and state but only if component is mounted
        streamRef.current = null;
        if (!isUnmountedRef.current) {
          setPreviewStream(null);
        }
      } catch (e) {
        console.error("Error stopping media stream:", e);
      }
    }
  };

  // Check if the stream is active
  const isStreamActive = () => {
    if (!streamRef.current) return false;
    
    try {
      const tracks = streamRef.current.getTracks();
      return tracks.length > 0 && tracks.some(track => track.readyState === "live");
    } catch (e) {
      return false;
    }
  };

  // Initialize the media stream
  const initializeStream = async (forceNew = false, options: MediaOptions = { video: true, audio: true }) => {
    if (isInitializing) {
      console.log("Already initializing stream, waiting...");
      return streamRef.current;
    }
    
    try {
      // Set initializing state
      setIsInitializing(true);
      
      // Set up a timeout to reset state if initialization takes too long
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      initTimeoutRef.current = setTimeout(() => {
        if (!isUnmountedRef.current) {
          setIsInitializing(false);
        }
      }, 10000); // 10 second timeout
      
      // Check for browser compatibility
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support media recording");
      }
      
      // If we already have an active stream and don't need to force new, return it
      if (!forceNew && streamRef.current && isStreamActive()) {
        console.log("Reusing existing active stream");
        setIsInitializing(false);
        clearTimeout(initTimeoutRef.current);
        return streamRef.current;
      }
      
      // Always stop any existing stream first
      stopMediaStream();
      
      console.log("Requesting camera access with options:", options);
      const stream = await navigator.mediaDevices.getUserMedia(options);
      console.log("Camera access granted successfully");
      
      // Only update state if component is still mounted
      if (!isUnmountedRef.current) {
        streamRef.current = stream;
        setPreviewStream(stream);
        setHasPermission(true);
        setIsInitializing(false);
      } else {
        // Clean up stream if component unmounted during initialization
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Clear the timeout since initialization succeeded
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      
      return stream;
    } catch (error: any) {
      console.error("Error initializing media stream:", error);
      
      // Only update state if component is still mounted
      if (!isUnmountedRef.current) {
        setIsInitializing(false);
        setHasPermission(false);
      }
      
      // Clear the timeout since we're handling the error now
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      
      // Simplified error messages
      let errorMessage = "Camera access error";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera access denied. Please check your browser permissions.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Camera not found. Please check your device.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Could not access your camera. It might be in use by another application.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (!isUnmountedRef.current) {
        toast({
          title: "Camera Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      throw new Error(errorMessage);
    }
  };

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
