
import { useState, useRef } from "react";
import { toast } from "@/components/ui/use-toast";

export function useVideoRecorder(previewStream: MediaStream | null, streamRef: React.RefObject<MediaStream | null>) {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  // Function to start recording
  const startRecording = async () => {
    try {
      console.log("Starting recording...");
      videoChunksRef.current = [];
      
      // Use the streamRef first (more reliable), fall back to previewStream
      let stream = streamRef.current || previewStream;
      
      // Clear error check: If we don't have a stream, we can't record
      if (!stream) {
        console.error("No camera stream available");
        throw new Error("Camera not available. Please enable your camera and try again.");
      }
      
      // Make sure we have video tracks
      if (stream.getVideoTracks().length === 0) {
        console.error("No video tracks found in stream");
        throw new Error("Camera not properly initialized. Please refresh and try again.");
      }
      
      // Create and configure the media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("Received video data chunk:", event.data.size, "bytes");
          videoChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log("Media recorder stopped, processing video...");
        if (videoChunksRef.current.length === 0) {
          console.error("No video chunks recorded");
          toast({
            title: "Recording Error",
            description: "No video data was captured. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        console.log("Created video blob:", videoBlob.size, "bytes");
        setVideoBlob(videoBlob);
        
        const videoUrl = URL.createObjectURL(videoBlob);
        console.log("Created video URL:", videoUrl);
        setVideoUrl(videoUrl);
        setIsRecording(false);
      };
      
      // Start the recorder
      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started");
      
      // Show toast notification that recording has started
      toast({
        title: "Recording started",
        description: "Your video recording has begun"
      });
    } catch (error: any) {
      console.error("Error starting video recording:", error);
      
      let errorMessage = error.message || "Error starting recording";
      
      toast({
        title: "Recording Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Make sure to rethrow so the UI can reset appropriately
      throw error;
    }
  };
  
  // Function to stop recording
  const stopRecording = () => {
    console.log("Stopping recording...");
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      console.log("Recording stopped via mediaRecorder.stop()");
      
      // Show toast notification that recording has stopped
      toast({
        title: "Recording complete",
        description: "Your video recording has been saved"
      });
    }
  };

  return {
    isRecording,
    videoBlob,
    videoUrl,
    startRecording,
    stopRecording,
    setVideoBlob,
    setVideoUrl
  };
}
