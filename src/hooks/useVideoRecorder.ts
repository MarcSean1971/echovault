
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { blobToBase64 } from "@/utils/audioUtils";

interface UseVideoRecorderOptions {
  onRecordingComplete?: (blob: Blob, videoURL: string) => void;
}

export function useVideoRecorder(options?: UseVideoRecorderOptions) {
  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);

  // Check browser support for recording
  useEffect(() => {
    checkBrowserSupport();
    return cleanupResources;
  }, [isRecording, videoURL, stream]);
  
  // Initialize camera when component mounts
  useEffect(() => {
    if (isBrowserSupported) {
      initCamera();
    }
  }, [isBrowserSupported]);

  // Check if the browser supports media recording
  const checkBrowserSupport = () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsBrowserSupported(false);
      showErrorToast("Browser Not Supported", 
        "Your browser doesn't support video recording functionality.");
      return false;
    }
    return true;
  };

  // Clean up all resources when component unmounts
  const cleanupResources = () => {
    // Stop media recorder if it's active
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      
      if (isRecording) {
        mediaRecorderRef.current.stop();
      }
    }
    
    // Revoke object URL to prevent memory leaks
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
    
    // Clear the timer
    stopTimer();
    
    // Stop all tracks in the stream
    stopStreamTracks();
  };

  // Helper function to stop stream tracks
  const stopStreamTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, [stream]);

  // Initialize the camera
  const initCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setStream(mediaStream);
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
        videoPreviewRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      showErrorToast("Camera Access Failed", 
        "Could not access your camera or microphone. Please check permissions.");
    }
  };

  // Helper to show error toast notifications
  const showErrorToast = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive"
    });
  };

  // Timer management functions
  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Media recorder event handlers
  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      videoChunksRef.current.push(event.data);
    }
  };

  const handleRecordingStop = () => {
    const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(videoBlob);
    setVideoURL(url);
    setVideoBlob(videoBlob);
  };

  // Recording control functions
  const startRecording = () => {
    if (!stream) return;
    
    videoChunksRef.current = [];
    
    try {
      // Initialize MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.onstop = handleRecordingStop;
      
      // Start recording and update state
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      
      // Start the timer
      startTimer();
    } catch (err) {
      console.error("Error starting recording:", err);
      showErrorToast("Recording Failed", 
        "Could not start video recording. Please try again.");
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Pause the timer
      stopTimer();
    }
  };
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume the timer
      startTimer();
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop the timer
      stopTimer();
    }
  };
  
  // Playback control functions
  const togglePlayback = () => {
    if (!recordedVideoRef.current || !videoURL) return;
    
    if (isPlaying) {
      recordedVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      recordedVideoRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const handleVideoEnded = () => {
    setIsPlaying(false);
  };
  
  // Reset recording state
  const reset = () => {
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
    setVideoURL(null);
    setVideoBlob(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);
    videoChunksRef.current = [];
  };
  
  // Process the recorded video
  const handleAccept = async () => {
    if (!videoBlob) return null;
    
    try {
      // Revoke camera access when accepting the video
      stopStreamTracks();
      
      const base64Video = await blobToBase64(videoBlob);
      
      // Notify about recording completion if callback provided
      if (options?.onRecordingComplete) {
        options.onRecordingComplete(videoBlob, base64Video);
      }
      
      return { videoBlob, base64Video };
    } catch (err) {
      console.error("Error processing video:", err);
      showErrorToast("Error", "Failed to process the recorded video.");
      return null;
    }
  };

  // Return values and methods
  return {
    isRecording,
    isPaused,
    isPlaying,
    recordingDuration,
    videoURL,
    videoBlob,
    isBrowserSupported,
    stream,
    videoPreviewRef,
    recordedVideoRef,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePlayback,
    handleVideoEnded,
    reset,
    handleAccept
  };
}
