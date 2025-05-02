
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface UseMediaStreamOptions {
  audio?: boolean;
  video?: boolean;
}

export function useMediaStream(options: UseMediaStreamOptions = { audio: true, video: true }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);

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

  // Initialize media stream
  const initStream = useCallback(async () => {
    try {
      if (!checkBrowserSupport()) return;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: options.video,
        audio: options.audio
      });
      
      setStream(mediaStream);
      return mediaStream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      toast({
        title: "Media Access Failed",
        description: "Could not access your camera or microphone. Please check permissions.",
        variant: "destructive"
      });
      return null;
    }
  }, [options.audio, options.video, checkBrowserSupport]);

  // Stop all tracks in the stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
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
    initStream,
    stopStream
  };
}
