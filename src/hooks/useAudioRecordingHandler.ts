
import { useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useAudioRecorder } from "./audio/useAudioRecorder";
import { useAudioManager } from "./audio/useAudioManager";
import { useAudioStorageManager } from "./audio/useAudioStorageManager";
import { useAudioProcessor } from "./audio/useAudioProcessor";

export function useAudioRecordingHandler() {
  const { setContent, setAudioContent } = useMessageForm();
  
  // Use our refactored custom hooks
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
    audioBlob,
    audioUrl,
    audioDuration,
    startRecording,
    stopRecording,
    setAudioBlob,
    setAudioUrl,
    cleanupResources
  } = useAudioRecorder(previewStream, streamRef);
  
  const {
    showAudioRecorder,
    setShowAudioRecorder,
    clearAudio: clearAudioInner,
    restoreAudio
  } = useAudioStorageManager(setContent, setAudioContent);
  
  const { transcribeAudio } = useAudioProcessor();
  
  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      console.log("Audio recording handler unmounting, cleaning up resources");
      
      // Ensure we stop recording if it's still ongoing
      if (isRecording) {
        try {
          stopRecording();
        } catch (e) {
          console.error("Error stopping recording during unmount:", e);
        }
      }
      
      // Clean up resources from the recorder
      cleanupResources();
      
      // Stop any active media streams
      if (isStreamActive()) {
        stopMediaStream();
      }
      
      // Clean up any audio URLs
      if (audioUrl) {
        try {
          URL.revokeObjectURL(audioUrl);
        } catch (e) {
          console.warn("Failed to revoke audio URL during unmount:", e);
        }
      }
    };
  }, [isRecording, stopRecording, cleanupResources, audioUrl, isStreamActive, stopMediaStream]);
  
  // Wrapper function for clearAudio using the storage manager
  const clearAudio = () => {
    clearAudioInner(isRecording, stopRecording, cleanupResources, isStreamActive, stopMediaStream);
  };
  
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
    transcribeAudio: () => transcribeAudio(audioBlob),
    isInitializationAttempted
  };
}
