
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface UseMediaStreamOptions {
  audio?: boolean;
  video?: boolean;
  videoConstraints?: MediaTrackConstraints;
}

export function useMediaStream(options: UseMediaStreamOptions = { audio: true, video: true }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  // Check browser support for media devices
  const checkBrowserSupport = useCallback(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsBrowserSupported(false);
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support media recording functionality.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  }, []);

  // Initialize media stream with enhanced constraints
  const initStream = useCallback(async () => {
    try {
      if (!checkBrowserSupport()) return null;
      
      setIsInitializing(true);
      
      // Default video constraints for better quality and performance
      const defaultVideoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      };
      
      const constraints = {
        video: options.video ? 
          (options.videoConstraints || defaultVideoConstraints) : 
          false,
        audio: options.audio
      };

      console.log("Requesting media with constraints:", constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log("Media stream acquired successfully");
      setStream(mediaStream);
      return mediaStream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      
      // More descriptive error messages based on error type
      let errorMessage = "Could not access your camera or microphone. Please check permissions.";
      
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMessage = "Camera/microphone access was denied. Please grant permission and try again.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorMessage = "No camera or microphone found on your device.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMessage = "Your camera or microphone is already in use by another application.";
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "The requested camera settings are not supported by your device.";
        }
      }
      
      toast({
        title: "Media Access Failed",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [options.audio, options.video, options.videoConstraints, checkBrowserSupport]);

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

  // Initialize stream when component mounts if browser is supported
  useEffect(() => {
    if (isBrowserSupported) {
      initStream();
    }
    
    // Clean up on unmount
    return () => {
      stopStream();
    };
  }, [isBrowserSupported, initStream, stopStream]);

  return {
    stream,
    isBrowserSupported,
    isInitializing,
    initStream,
    stopStream
  };
}
