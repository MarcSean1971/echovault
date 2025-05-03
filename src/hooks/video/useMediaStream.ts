
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { checkBrowserSupport } from "./videoUtils";

interface UseMediaStreamOptions {
  audio?: boolean;
  video?: boolean;
  videoConstraints?: MediaTrackConstraints;
  autoInitialize?: boolean;
}

export function useMediaStream(options: UseMediaStreamOptions = { audio: true, video: true, autoInitialize: false }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const initAttempts = useRef(0);

  // Check if browser supports media devices
  const verifyBrowserSupport = useCallback(() => {
    const supported = checkBrowserSupport();
    setIsBrowserSupported(supported);
    
    if (!supported) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support media recording functionality.",
        variant: "destructive"
      });
    }
    
    return supported;
  }, []);

  // Initialize media stream with enhanced constraints and retry logic
  const initStream = useCallback(async () => {
    try {
      if (!verifyBrowserSupport()) return null;
      
      setIsInitializing(true);
      initAttempts.current += 1;
      console.log(`Initializing media stream (attempt ${initAttempts.current})`);
      
      // Reset permission denied state on new attempts
      setPermissionDenied(false);
      
      // Try with lower quality first if this is a retry attempt
      let videoConstraints: MediaTrackConstraints = options.videoConstraints || {};
      
      if (initAttempts.current > 1) {
        console.log("Using fallback lower quality constraints");
        videoConstraints = {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        };
      } else {
        // Default video constraints for better quality and performance
        videoConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          ...videoConstraints
        };
      }
      
      const constraints = {
        video: options.video ? videoConstraints : false,
        audio: options.audio
      };

      console.log("Requesting media with constraints:", constraints);
      
      // Remove the problematic timeout that was causing "Permission request timeout" errors
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!mediaStream) throw new Error("Failed to get media stream");
      
      console.log("Media stream acquired successfully:", mediaStream.getTracks().length, "tracks");
      console.log("Video tracks:", mediaStream.getVideoTracks().length);
      console.log("Audio tracks:", mediaStream.getAudioTracks().length);
      
      setStream(mediaStream);
      return mediaStream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      
      // More descriptive error messages based on error type
      let errorMessage = "Could not access your camera or microphone. Please check permissions.";
      let shouldRetry = false;
      
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMessage = "Camera/microphone access was denied. Please grant permission and try again.";
          setPermissionDenied(true);
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorMessage = "No camera or microphone found on your device.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMessage = "Your camera or microphone is already in use by another application.";
          shouldRetry = true;
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "The requested camera settings are not supported by your device.";
          shouldRetry = initAttempts.current < 2; // Only retry once with lower quality
        } else if (err.name === "AbortError") {
          errorMessage = "Hardware or permission error. Please check your device and permissions.";
        }
      }
      
      console.error(errorMessage);
      
      // Don't show toast for initial load, as it might be confusing
      if (initAttempts.current > 1) {
        toast({
          title: "Camera Access Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      // Auto retry once with lower quality if appropriate
      if (shouldRetry && initAttempts.current < 2) {
        console.log("Will retry with lower quality");
        setTimeout(() => initStream(), 1000);
      }
      
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [options.audio, options.video, options.videoConstraints, verifyBrowserSupport]);

  // Stop all tracks in the stream
  const stopStream = useCallback(() => {
    if (stream) {
      console.log("Stopping all media tracks");
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      setStream(null);
    }
  }, [stream]);

  // Reset state for a fresh initialization
  const resetStream = useCallback(() => {
    stopStream();
    initAttempts.current = 0;
    setPermissionDenied(false);
  }, [stopStream]);

  // Initialize stream when component mounts if browser is supported AND autoInitialize is true
  useEffect(() => {
    if (isBrowserSupported && options.autoInitialize) {
      console.log("Auto-initializing media stream");
      initStream().catch(err => {
        console.error("Failed initial stream initialization:", err);
      });
    }
    
    // Clean up on unmount
    return () => {
      stopStream();
    };
  }, [isBrowserSupported, options.autoInitialize, initStream, stopStream]);

  return {
    stream,
    isBrowserSupported,
    isInitializing,
    permissionDenied,
    initStream,
    stopStream,
    resetStream
  };
}
