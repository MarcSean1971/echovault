
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export function useVideoRecordingHandler() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up video URL when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      stopMediaStream();
    };
  }, [videoUrl]);

  // Function to stop media stream
  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Function to start recording
  const startRecording = async () => {
    try {
      videoChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        setVideoBlob(videoBlob);
        const videoUrl = URL.createObjectURL(videoBlob);
        setVideoUrl(videoUrl);
        setIsRecording(false);
        stopMediaStream();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting video recording:", error);
      toast({
        title: "Permission Error",
        description: "Please allow camera and microphone access to record video.",
        variant: "destructive"
      });
    }
  };
  
  // Function to stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };
  
  // Function to clear recorded video
  const clearVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoBlob(null);
    setVideoUrl(null);
  };
  
  return {
    isRecording,
    videoBlob,
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    startRecording,
    stopRecording,
    clearVideo
  };
}
