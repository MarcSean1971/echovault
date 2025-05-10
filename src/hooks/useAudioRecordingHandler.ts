
import { useState, useEffect, useRef } from 'react';
import { useMessageForm } from '@/components/message/MessageFormContext';

export function useAudioRecordingHandler() {
  const { messageType } = useMessageForm();
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize audio recording when prompted
  const initializeAudio = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      // Request audio permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      setHasPermission(true);
      
      // Set up event handlers for the MediaRecorder
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Reset chunks for next recording
        audioChunksRef.current = [];
        
        setIsRecording(false);
        console.log("Audio recording stopped and processed");
      };
      
      console.log("Audio recording initialized successfully");
    } catch (err: any) {
      console.error("Error initializing audio recording:", err);
      setError(err.message || "Error accessing microphone");
      setHasPermission(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Start recording
  const startRecording = () => {
    if (!mediaRecorderRef.current || !hasPermission) {
      console.error("Cannot start recording: recorder not initialized or permission denied");
      return;
    }
    
    try {
      // Clear previous recording if any
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }
      
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      console.log("Audio recording started");
    } catch (err) {
      console.error("Error starting audio recording:", err);
      setError("Failed to start recording");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) {
      console.log("No active recording to stop");
      return;
    }
    
    try {
      mediaRecorderRef.current.stop();
      console.log("Audio recording stopping...");
      // The onstop handler will set isRecording to false
    } catch (err) {
      console.error("Error stopping audio recording:", err);
      setError("Failed to stop recording");
      setIsRecording(false);
    }
  };

  // Stop and release audio stream
  const stopStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
      console.log("Audio stream stopped and released");
    }
  };

  // Check if audio stream is active
  const isStreamActive = () => {
    return !!audioStreamRef.current;
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      stopStream();
    };
  }, [audioURL]);

  // Auto-stop recording if user switches away from audio mode
  useEffect(() => {
    if (messageType !== "text" && isRecording) {
      stopRecording();
    }
  }, [messageType, isRecording]);

  return {
    isRecording,
    audioURL,
    isInitializing,
    hasPermission,
    error,
    initializeAudio,
    startRecording,
    stopRecording,
    stopStream,
    isStreamActive
  };
}
