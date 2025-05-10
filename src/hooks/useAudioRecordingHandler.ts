
import { useState, useRef, useCallback } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useAudioManager } from "./audio/useAudioManager";
import { useAudioProcessor } from "./audio/useAudioProcessor";
import { useAudioRecorder } from "./audio/useAudioRecorder";
import { useAudioStorage } from "./audio/useAudioStorage";

export function useAudioRecordingHandler() {
  const { setAudioContent } = useMessageForm();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  
  // Use our audio hooks
  const {
    previewStream,
    isInitializing,
    hasPermission,
    streamRef,
    initializeStream,
    stopMediaStream,
    isStreamActive,
    forceInitializeMicrophone,
    isInitializationAttempted
  } = useAudioManager();
  
  const {
    isRecording,
    startRecording: startRecordingInner,
    stopRecording,
    setAudioBlob: setAudioBlobInner,
    setAudioUrl: setAudioUrlInner,
    cleanupResources
  } = useAudioRecorder(previewStream, streamRef);
  
  const {
    showAudioRecorder,
    setShowAudioRecorder,
    clearAudio: clearAudioInner,
    restoreAudio: restoreAudioInner
  } = useAudioStorage();
  
  const {
    transcribeAudio: transcribeAudioInner,
    formatAudioContent
  } = useAudioProcessor();
  
  // Initialize stream
  const initializeStreamWithSetup = useCallback(async () => {
    try {
      return await initializeStream();
    } catch (error) {
      console.error("Error initializing audio stream:", error);
      throw error;
    }
  }, [initializeStream]);
  
  // Start recording wrapper
  const startRecording = useCallback(async () => {
    try {
      // Pass a callback to update duration
      await startRecordingInner((duration) => {
        setAudioDuration(duration);
      });
      return true;
    } catch (error) {
      console.error("Error in startRecording wrapper:", error);
      throw error;
    }
  }, [startRecordingInner]);
  
  // Clear audio
  const clearAudio = useCallback(() => {
    clearAudioInner(audioUrl, setAudioBlob, setAudioUrl);
    setAudioContent('');
    setAudioDuration(0);
  }, [audioUrl, setAudioContent, clearAudioInner]);
  
  // Restore audio
  const restoreAudio = useCallback((blob: Blob, url: string, duration?: number) => {
    restoreAudioInner(blob, url, setAudioBlob, setAudioUrl);
    
    if (duration) {
      setAudioDuration(duration);
    }
    
    // Convert blob back to base64 and update audio content
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result?.toString().split(',')[1] || '';
      const formattedContent = JSON.stringify({
        audioData: base64data,
        timestamp: new Date().toISOString(),
        duration: duration || 0
      });
      console.log("Restoring audio content in form state");
      setAudioContent(formattedContent);
    };
  }, [restoreAudioInner, setAudioContent]);
  
  // Transcribe audio
  const transcribeAudio = useCallback(async () => {
    if (!audioBlob) {
      throw new Error("No audio to transcribe");
    }
    
    try {
      console.log("Transcribing audio...");
      // Use transcribeAudioInner with the correct argument
      const transcription = await transcribeAudioInner(audioBlob);
      console.log("Audio transcription complete:", transcription);
      return transcription;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw error;
    }
  }, [audioBlob, transcribeAudioInner]);
  
  return {
    isRecording,
    isInitializing,
    hasPermission,
    audioBlob,
    audioUrl,
    audioDuration,
    showAudioRecorder,
    setShowAudioRecorder,
    previewStream: previewStream,
    initializeStream: initializeStreamWithSetup,
    forceInitializeMicrophone,
    startRecording,
    stopRecording,
    clearAudio,
    restoreAudio,
    transcribeAudio,
    stopMediaStream,
    isStreamActive,
    isInitializationAttempted
  };
}
