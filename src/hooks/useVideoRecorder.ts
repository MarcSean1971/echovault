
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { blobToBase64 } from "@/utils/audioUtils";

interface UseVideoRecorderOptions {
  onRecordingComplete?: (blob: Blob, videoURL: string) => void;
}

export function useVideoRecorder(options?: UseVideoRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);

  // Check for browser support
  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsBrowserSupported(false);
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support video recording functionality.",
        variant: "destructive"
      });
    }
    
    return () => {
      // Clean up resources when component unmounts
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        
        if (isRecording) {
          mediaRecorderRef.current.stop();
        }
      }
      
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording, videoURL, stream]);
  
  // Initialize webcam stream
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
      toast({
        title: "Camera Access Failed",
        description: "Could not access your camera or microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    if (isBrowserSupported) {
      initCamera();
    }
  }, [isBrowserSupported]);
  
  const startRecording = () => {
    if (!stream) return;
    
    videoChunksRef.current = [];
    
    try {
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(videoBlob);
        setVideoURL(url);
        setVideoBlob(videoBlob);
      };
      
      // Start recording and update state
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      
      // Start the timer
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: "Recording Failed",
        description: "Could not start video recording. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Pause the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume the timer
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
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
  
  const handleAccept = async () => {
    if (!videoBlob) return;
    
    try {
      // Revoke camera access when accepting the video
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const base64Video = await blobToBase64(videoBlob);
      
      // Notify about recording completion if callback provided
      if (options?.onRecordingComplete) {
        options.onRecordingComplete(videoBlob, base64Video);
      }
      
      return { videoBlob, base64Video };
    } catch (err) {
      console.error("Error processing video:", err);
      toast({
        title: "Error",
        description: "Failed to process the recorded video.",
        variant: "destructive"
      });
      return null;
    }
  };

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
