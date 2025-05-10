
import { useState, useCallback, useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { safeRevokeObjectURL } from "@/utils/mediaUtils";
import { useAudioProcessor } from "./audio/useAudioProcessor";
import { useAudioStorageManager } from "./audio/useAudioStorageManager";
import { useAudioRecorder } from "./audio/useAudioRecorder";
import { useMediaStream } from "./video/useMediaStream"; // Reusing the media stream logic

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
  initializeStream: () => Promise<MediaStream | null>;
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
  const { content, setContent, setAudioContent } = useMessageForm();
  const [audioDuration, setAudioDuration] = useState(0);
  const [isInitializationAttempted, setIsInitializationAttempted] = useState(false);
  const { formatAudioContent } = useAudioProcessor();
  
  // Use our audio storage manager
  const {
    audioBlob,
    audioUrl,
    setAudioBlob,
    setAudioUrl,
    showAudioRecorder,
    setShowAudioRecorder,
    clearAudio: clearAudioBase,
    restoreAudio: restoreAudioBase
  } = useAudioStorageManager(setContent, setAudioContent);
  
  // Use mediaStream hook for microphone access (shared with video)
  const {
    previewStream,
    isInitializing,
    hasPermission,
    streamRef,
    initializeStream: initializeStreamBase,
    stopMediaStream,
    isStreamActive
  } = useMediaStream();
  
  // Initialize audio recorder
  const {
    isRecording,
    audioBlob: recorderAudioBlob,
    audioUrl: recorderAudioUrl,
    audioDuration: recorderAudioDuration,
    startRecording: startRecordingBase,
    stopRecording: stopRecordingBase,
    cleanupResources
  } = useAudioRecorder(previewStream, streamRef);
  
  // Update audioDuration state when recorder duration changes
  useEffect(() => {
    setAudioDuration(recorderAudioDuration);
  }, [recorderAudioDuration]);
  
  // Initialize audio stream with options optimized for audio
  const initializeStream = useCallback(async () => {
    try {
      setIsInitializationAttempted(true);
      return await initializeStreamBase(false, { audio: true, video: false });
    } catch (error) {
      console.error("Error initializing audio stream:", error);
      return null;
    }
  }, [initializeStreamBase]);
  
  // Force initialize microphone - used by media manager
  const forceInitializeMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      setIsInitializationAttempted(true);
      
      // Stop any existing stream first
      if (isStreamActive()) {
        stopMediaStream();
      }
      
      const stream = await initializeStreamBase(true, { audio: true, video: false });
      return !!stream;
    } catch (error) {
      console.error("Force initialize microphone failed:", error);
      return false;
    }
  }, [initializeStreamBase, stopMediaStream, isStreamActive]);
  
  // Start recording wrapper
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      await startRecordingBase();
      return true;
    } catch (error) {
      console.error("Error in startRecording wrapper:", error);
      throw error;
    }
  }, [startRecordingBase]);
  
  // Stop recording with processing
  const stopRecording = useCallback(() => {
    stopRecordingBase(async (blob: Blob, url: string, duration: number) => {
      console.log("Audio recording stopped with", 
                  "blob size:", blob.size, 
                  "duration:", duration);
      
      // Set blob and url
      setAudioBlob(blob);
      setAudioUrl(url);
      setAudioDuration(duration);
      
      // Format audio content for form
      try {
        const formattedContent = await formatAudioContent(blob);
        setAudioContent(formattedContent);
        setContent(formattedContent);
      } catch (err) {
        console.error("Error formatting audio content:", err);
      }
    });
  }, [stopRecordingBase, setAudioBlob, setAudioUrl, setAudioContent, setContent, formatAudioContent]);
  
  // Clear audio wrapper
  const clearAudio = useCallback(() => {
    clearAudioBase(isRecording, stopRecordingBase, cleanupResources, isStreamActive, stopMediaStream);
  }, [clearAudioBase, isRecording, stopRecordingBase, cleanupResources, isStreamActive, stopMediaStream]);
  
  // Restore audio wrapper
  const restoreAudio = useCallback((blob: Blob, url: string) => {
    restoreAudioBase(blob, url);
  }, [restoreAudioBase]);
  
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
