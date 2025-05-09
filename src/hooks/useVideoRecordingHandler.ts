import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export function useVideoRecordingHandler() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Debug logs for state changes
  useEffect(() => {
    console.log("useVideoRecordingHandler: isRecording =", isRecording, 
                "videoBlob =", videoBlob ? "present" : "null", 
                "videoUrl =", videoUrl ? "present" : "null",
                "previewStream =", previewStream ? "active" : "null");
  }, [isRecording, videoBlob, videoUrl, showVideoRecorder, previewStream]);

  // Clean up video URL and stream when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      stopMediaStream();
    };
  }, []);

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

  // Function to start recording
  const startRecording = async () => {
    try {
      console.log("Starting recording...");
      videoChunksRef.current = [];
      
      let stream = previewStream;
      
      // If we don't have a preview stream, initialize it
      if (!stream) {
        try {
          stream = await initializeStream();
        } catch (error) {
          return; // Exit if we can't initialize the stream
        }
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
      
      let errorMessage = "Error starting recording";
      
      toast({
        title: "Recording Error",
        description: errorMessage,
        variant: "destructive"
      });
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
  
  // Function to clear recorded video
  const clearVideo = () => {
    console.log("Clearing video...");
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoBlob(null);
    setVideoUrl(null);
    console.log("Video cleared");
  };
  
  // New function to restore video from blob and url
  const restoreVideo = (blob: Blob, url: string) => {
    console.log("Restoring video from blob:", blob.size, "bytes");
    setVideoBlob(blob);
    setVideoUrl(url);
    console.log("Video restored");
  };
  
  return {
    isRecording,
    isInitializing,
    hasPermission,
    videoBlob,
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    previewStream,
    initializeStream,
    startRecording,
    stopRecording,
    clearVideo,
    restoreVideo
  };
}
