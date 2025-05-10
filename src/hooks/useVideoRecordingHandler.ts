
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { safeCreateObjectURL, safeRevokeObjectURL } from "@/utils/mediaUtils";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useVideoRecordingHandler() {
  const { setVideoContent } = useMessageForm();
  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [isInitializationAttempted, setIsInitializationAttempted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const previewStreamRef = useRef<MediaStream | null>(null);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach(track => track.stop());
      previewStreamRef.current = null;
    }
    
    chunksRef.current = [];
    if (videoUrl) {
      safeRevokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
  }, [videoUrl]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  // Initialize media stream
  const initializeStream = useCallback(async () => {
    try {
      cleanup();
      setIsInitializing(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      
      mediaStreamRef.current = stream;
      previewStreamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        chunksRef.current = [];
        
        const url = safeCreateObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
        
        // Format and save the video content for the form
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result?.toString().split(',')[1] || '';
          // Create formatted video content with timestamp
          const formattedContent = JSON.stringify({
            videoData: base64data,
            timestamp: new Date().toISOString()
          });
          setVideoContent(formattedContent);
        };
      };
      
      mediaRecorderRef.current = recorder;
      setHasPermission(true);
      setIsInitializing(false);
      setIsInitializationAttempted(true);
      
      return true;
    } catch (error: any) {
      console.error("Error initializing video stream:", error);
      setHasPermission(false);
      setIsInitializing(false);
      setIsInitializationAttempted(true);
      
      // Show error toast
      toast({
        title: "Camera Access Error",
        description: error.message || "Could not access camera or microphone",
        variant: "destructive"
      });
      
      return false;
    }
  }, [cleanup, setVideoContent]);
  
  // Force initialize camera
  const forceInitializeCamera = useCallback(async () => {
    return await initializeStream();
  }, [initializeStream]);
  
  // Start recording
  const startRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !mediaStreamRef.current) {
      const initResult = await initializeStream();
      if (!initResult) {
        throw new Error("Could not initialize camera or microphone");
      }
    }
    
    if (mediaRecorderRef.current) {
      chunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      return true;
    }
    
    return false;
  }, [initializeStream]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return true;
    }
    return false;
  }, []);
  
  // Clear video
  const clearVideo = useCallback(() => {
    if (videoUrl) {
      safeRevokeObjectURL(videoUrl);
    }
    setVideoBlob(null);
    setVideoUrl(null);
    setVideoContent('');
  }, [videoUrl, setVideoContent]);
  
  // Restore video from blob
  const restoreVideo = useCallback((blob: Blob, url: string) => {
    setVideoBlob(blob);
    setVideoUrl(url);
    
    // Convert blob back to base64 and update video content
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result?.toString().split(',')[1] || '';
      // Create formatted video content with timestamp
      const formattedContent = JSON.stringify({
        videoData: base64data,
        timestamp: new Date().toISOString()
      });
      console.log("Restoring video content in form state");
      setVideoContent(formattedContent);
    };
  }, [setVideoContent]);
  
  // Stop media stream
  const stopMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      previewStreamRef.current = null;
      return true;
    }
    return false;
  }, []);
  
  // Check if stream is active
  const isStreamActive = useCallback(() => {
    return !!mediaStreamRef.current && 
      mediaStreamRef.current.getTracks().some(track => track.readyState === 'live');
  }, []);
  
  return {
    isRecording,
    isInitializing,
    hasPermission,
    videoBlob,
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    previewStream: previewStreamRef.current,
    initializeStream,
    forceInitializeCamera,
    startRecording,
    stopRecording,
    clearVideo,
    restoreVideo,
    stopMediaStream,
    isStreamActive,
    isInitializationAttempted
  };
}
