
import { useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { blobToBase64 } from "@/utils/audioUtils";

interface UseVideoRecordingControlsProps {
  streamReady: boolean;
  stream: MediaStream | null;
  startRecording: () => void;
  resetRecording: () => void;
  videoBlob: Blob | null;
  stopStream: () => void;
  initializeStream: () => Promise<boolean>;
  onRecordingComplete?: (blob: Blob, videoURL: string) => void;
}

export function useVideoRecordingControls({
  streamReady,
  stream,
  startRecording,
  resetRecording,
  videoBlob,
  stopStream,
  initializeStream,
  onRecordingComplete
}: UseVideoRecordingControlsProps) {
  // Start recording with better checks and feedback
  const safeStartRecording = useCallback(() => {
    if (!streamReady) {
      console.log("Stream not ready, cannot start recording");
      toast({
        title: "Camera not ready",
        description: "Please wait for camera to initialize or try again.",
        variant: "destructive"
      });
      
      // Try to reinitialize if needed
      if (!stream || !streamReady) {
        initializeStream();
      }
      return;
    }
    
    console.log("Starting recording with stream:", stream?.id);
    startRecording();
  }, [stream, streamReady, startRecording, initializeStream]);
  
  // Reset recording state and prepare for new recording
  const reset = useCallback(() => {
    console.log("Resetting video recorder");
    resetRecording();
    
    // Reinitialize the stream if it was stopped
    if (!stream) {
      initializeStream();
    }
  }, [resetRecording, stream, initializeStream]);
  
  // Process and accept the recorded video
  const handleAccept = useCallback(async () => {
    if (!videoBlob) {
      console.log("No video blob available");
      return null;
    }
    
    console.log(`Processing video blob (size: ${videoBlob.size}, type: ${videoBlob.type})`);
    
    try {
      // Revoke camera access when accepting the video
      stopStream();
      
      const base64Video = await blobToBase64(videoBlob);
      console.log("Video converted to base64 successfully");
      
      // Notify about recording completion if callback provided
      if (onRecordingComplete) {
        onRecordingComplete(videoBlob, base64Video);
      }
      
      return { videoBlob, base64Video };
    } catch (err) {
      console.error("Error processing video:", err);
      toast({
        title: "Processing Error",
        description: "Failed to process the recorded video.",
        variant: "destructive"
      });
      return null;
    }
  }, [videoBlob, stopStream, onRecordingComplete]);
  
  return {
    safeStartRecording,
    reset,
    handleAccept
  };
}
