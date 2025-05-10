
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

  useEffect(() => {
    return () => {
      // Mark component as unmounted to prevent state updates
      isUnmountedRef.current = true;
      
      // Ensure we stop all tracks
      stopMediaStream();
    };
  }, []);

  // Function to stop media stream with enhanced logging and error handling
  const stopMediaStream = () => {
    if (streamRef.current) {
      console.log("Stopping media stream tracks...");
      try {
        const tracks = streamRef.current.getTracks();
        console.log(`Stopping ${tracks.length} track(s)...`);
        
        tracks.forEach(track => {
          try {
            console.log(`Stopping ${track.kind} track (${track.readyState})...`);
            track.stop();
            console.log(`${track.kind} track stopped successfully`);
          } catch (e) {
            console.warn(`Error stopping ${track.kind} track:`, e);
          }
        });
        
        // Important: Clear both the ref and the state
        streamRef.current = null;
        
        // Only update state if component is still mounted
        if (!isUnmountedRef.current) {
          setPreviewStream(null);
          console.log("Media stream state cleared");
        }
      } catch (e) {
        console.error("Error stopping media stream:", e);
      }
    } else {
      console.log("No media stream to stop");
    }
  };

  // Check if the stream is actually active (not stopped)
  const isStreamActive = () => {
    if (!streamRef.current) return false;
    
    try {
      // Check if all tracks are active
      const allTracks = streamRef.current.getTracks();
      if (allTracks.length === 0) return false;
      
      const activeTracks = allTracks.filter(track => track.readyState === "live");
      return activeTracks.length > 0;
    } catch (e) {
      console.error("Error checking stream active state:", e);
      return false;
    }
  };

  // Check for browser compatibility
  const checkBrowserCompatibility = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia not supported in this browser");
      return false;
    }
    return true;
  };

  // Initialize the media stream for preview before recording
  const initializeStream = async (forceNew = false, options: MediaOptions = { video: true, audio: true }) => {
    try {
      // Check browser compatibility first
      if (!checkBrowserCompatibility()) {
        throw new Error("Your browser doesn't support media recording. Please try a modern browser like Chrome, Firefox, or Edge.");
      }
      
      // If we already have an active stream and don't need to force new, return it
      if (!forceNew && streamRef.current && isStreamActive()) {
        console.log("Reusing existing active stream");
        return streamRef.current;
      }
      
      setIsInitializing(true);
      console.log(`Initializing ${options.video ? 'camera' : 'microphone'} for preview...`);
      console.log("Stream options:", options);
      
      // Always stop any existing stream first
      stopMediaStream();
      
      // Try to get user media with specified options
      const stream = await navigator.mediaDevices.getUserMedia(options);
      
      // Log the tracks we got
      const tracks = stream.getTracks();
      console.log("Obtained media tracks:", tracks.map(t => `${t.kind} (${t.readyState})`));
      
      if (options.audio && stream.getAudioTracks().length === 0) {
        console.warn("No audio tracks found in the stream despite requesting audio");
      }
      
      if (options.video && stream.getVideoTracks().length === 0) {
        console.warn("No video tracks found in the stream despite requesting video");
      }
      
      console.log(`${options.video ? 'Camera' : 'Microphone'} preview initialized successfully`);
      
      // Only update state if component is still mounted
      if (!isUnmountedRef.current) {
        streamRef.current = stream;
        setPreviewStream(stream);
        setHasPermission(true);
      } else {
        // If component unmounted while we were initializing, clean up the stream
        console.log("Component unmounted during stream initialization. Cleaning up stream...");
        stream.getTracks().forEach(track => track.stop());
      }
      
      return stream;
    } catch (error: any) {
      console.error(`Error initializing ${options.video ? 'camera' : 'microphone'}:`, error);
      
      // Only update state if component is still mounted
      if (!isUnmountedRef.current) {
        setHasPermission(false);
      }
      
      // More specific error messages based on common issues
      let errorMessage = `Error accessing ${options.video ? 'camera' : 'microphone'}`;
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = `${options.video ? 'Camera' : 'Microphone'} access was denied. Please check your browser permissions.`;
      } else if (error.name === 'NotFoundError') {
        errorMessage = `${options.video ? 'Camera' : 'Microphone'} not found. Please check your device.`;
      } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
        errorMessage = `Could not access your ${options.video ? 'camera' : 'microphone'}. It might be in use by another application.`;
      } else if (error.name === 'SecurityError') {
        errorMessage = "Media access is not allowed in this context. Please check your settings.";
      } else if (error.name === 'TypeError') {
        errorMessage = "Incorrect media constraints specified.";
      } else if (error.message) {
        // Include the actual error message for better debugging
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      // Only show toast if component is still mounted
      if (!isUnmountedRef.current) {
        toast({
          title: "Permission Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      throw new Error(errorMessage);
    } finally {
      // Only update state if component is still mounted
      if (!isUnmountedRef.current) {
        setIsInitializing(false);
      }
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
