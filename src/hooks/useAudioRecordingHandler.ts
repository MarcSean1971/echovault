
import { useState, useRef, useCallback, useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { safeCreateObjectURL, safeRevokeObjectURL } from "@/utils/mediaUtils";

export interface AudioRecordingHandlerResult {
  isRecording: boolean;
  isInitializing: boolean;
  hasPermission: boolean | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioDuration: number;
  showAudioRecorder: boolean;
  setShowAudioRecorder: (show: boolean) => void;
  previewStream: MediaStream | null;
  initializeStream: (forceNew?: boolean) => Promise<MediaStream | null>;
  forceInitializeMicrophone: () => Promise<boolean>;
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;
  clearAudio: () => void;
  restoreAudio: (blob: Blob, url: string) => void;
  stopMediaStream: () => void;
  isStreamActive: () => boolean;
  isInitializationAttempted: boolean;
}

export function useAudioRecordingHandler(): AudioRecordingHandlerResult {
  const { setAudioContent } = useMessageForm();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isInitializationAttempted, setIsInitializationAttempted] = useState(false);
  
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize the media stream
  const initializeStream = useCallback(async (forceNew = false) => {
    try {
      setIsInitializing(true);
      setIsInitializationAttempted(true);
      
      // Clear any existing stream
      if (forceNew && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // If we already have a stream and aren't forcing new, use it
      if (!forceNew && streamRef.current) {
        setIsInitializing(false);
        return streamRef.current;
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPreviewStream(stream);
      setHasPermission(true);
      setIsInitializing(false);
      return stream;
    } catch (error) {
      console.error("Microphone initialization error:", error);
      setHasPermission(false);
      setIsInitializing(false);
      return null;
    }
  }, []);

  const forceInitializeMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await initializeStream(true);
      return !!stream;
    } catch (error) {
      console.error("Failed to initialize microphone:", error);
      return false;
    }
  }, [initializeStream]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      // Get the stream
      let stream = streamRef.current;
      if (!stream) {
        stream = await initializeStream();
        if (!stream) return false;
      }
      
      // Reset chunks
      audioChunksRef.current = [];
      
      // Create recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          console.error("No audio data captured");
          return;
        }
        
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        const url = safeCreateObjectURL(blob);
        setAudioUrl(url);
        
        // Update form state
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result?.toString().split(',')[1] || '';
          setAudioContent(base64data);
        };
        
        // Clear timer
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start duration timer
      let duration = 0;
      durationIntervalRef.current = setInterval(() => {
        duration += 1;
        setAudioDuration(duration);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error("Error starting recording:", error);
      return false;
    }
  }, [initializeStream, setAudioContent]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const stopMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setPreviewStream(null);
    }
  }, []);

  const isStreamActive = useCallback(() => {
    if (!streamRef.current) return false;
    return streamRef.current.getTracks().some(track => track.readyState === "live");
  }, []);

  const clearAudio = useCallback(() => {
    if (audioUrl) {
      safeRevokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioDuration(0);
    setAudioContent('');
  }, [audioUrl, setAudioContent]);

  const restoreAudio = useCallback((blob: Blob, url: string) => {
    setAudioBlob(blob);
    
    const freshUrl = safeCreateObjectURL(blob) || url;
    setAudioUrl(freshUrl);
    
    // Convert to base64 for form state
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result?.toString().split(',')[1] || '';
      setAudioContent(base64data);
    };
  }, [setAudioContent]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      stopMediaStream();
      if (audioUrl) {
        safeRevokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl, stopMediaStream]);

  return {
    isRecording,
    isInitializing,
    hasPermission,
    audioBlob,
    audioUrl,
    audioDuration,
    showAudioRecorder,
    setShowAudioRecorder,
    previewStream,
    initializeStream,
    forceInitializeMicrophone,
    startRecording,
    stopRecording,
    clearAudio,
    restoreAudio,
    stopMediaStream,
    isStreamActive,
    isInitializationAttempted
  };
}
