
import { useState, useRef, useCallback, useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { safeCreateObjectURL, safeRevokeObjectURL } from "@/utils/mediaUtils";
import { useMediaStream } from "./video/useMediaStream"; // Fixed import path
import { useAudioRecorder } from "./hooks/audio/useAudioRecorder";
import { useAudioProcessor } from "./audio/useAudioProcessor";

/**
 * Hook for handling audio recording functionality
 */
export function useAudioRecordingHandler() {
  // Get the message form context to set audio content
  const { setAudioContent } = useMessageForm();
  
  // Audio state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isInitializationAttempted, setIsInitializationAttempted] = useState(false);
  
  // Audio processor for formatting audio content
  const { formatAudioContent } = useAudioProcessor();
  
  // Media stream handling
  const {
    previewStream,
    isInitializing,
    hasPermission,
    streamRef,
    initializeStream,
    stopMediaStream,
    isStreamActive
  } = useMediaStream('audio');
  
  // Audio recorder
  const {
    isRecording,
    startRecording: startAudioRecordingInternal,
    stopRecording,
    audioBlob: recorderAudioBlob, // Store the blob from recorder
    audioDuration: recorderAudioDuration // Store the duration from recorder
  } = useAudioRecorder(previewStream, streamRef);
  
  // Update duration from the recorder
  useEffect(() => {
    if (recorderAudioDuration !== undefined) {
      setAudioDuration(recorderAudioDuration);
    }
  }, [recorderAudioDuration]);
  
  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        safeRevokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  // Initialize the audio stream with attempt tracking
  const initializeStreamWithAttemptTracking = useCallback(async () => {
    setIsInitializationAttempted(true);
    return await initializeStream();
  }, [initializeStream]);
  
  // Start recording with content updating
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      // Track that we attempted initialization
      setIsInitializationAttempted(true);
      
      // Start the actual recording
      await startAudioRecordingInternal();
      return true;
    } catch (error) {
      console.error("Error starting audio recording:", error);
      return false;
    }
  }, [startAudioRecordingInternal]);
  
  // Force microphone initialization
  const forceInitializeMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      setIsInitializationAttempted(true);
      
      // Stop any existing stream
      if (isStreamActive()) {
        stopMediaStream();
      }
      
      // Request a new audio-only stream
      const stream = await initializeStream();
      return stream !== null; // Fix void conditional check
    } catch (error) {
      console.error("Force initialize microphone failed:", error);
      return false;
    }
  }, [initializeStream, stopMediaStream, isStreamActive]);
  
  // Handle stopping recording with content update
  const handleStopRecording = useCallback(async (): Promise<void> => {
    try {
      // First stop the recording which should set the audioBlob and audioUrl
      const recordedBlob = await stopRecording();
      
      if (recordedBlob) {
        // Format the audio content and update the form
        const formattedContent = await formatAudioContent(recordedBlob);
        setAudioContent(formattedContent);
      } else {
        console.error("No audio blob available after recording");
      }
    } catch (error) {
      console.error("Error stopping audio recording:", error);
    }
  }, [stopRecording, formatAudioContent, setAudioContent]);
  
  // Clear audio
  const clearAudio = useCallback(() => {
    // Revoke object URL if it exists
    if (audioUrl) {
      safeRevokeObjectURL(audioUrl);
    }
    
    // Clear state
    setAudioUrl(null);
    setAudioBlob(null);
    setAudioContent('');
    setAudioDuration(0);
    
    // Stop any active stream
    if (isStreamActive()) {
      stopMediaStream();
    }
  }, [audioUrl, setAudioContent, stopMediaStream, isStreamActive]);
  
  // Restore audio
  const restoreAudio = useCallback((blob: Blob, url: string) => {
    // Set state
    setAudioBlob(blob);
    setAudioUrl(url);
    
    // Format content and update form
    formatAudioContent(blob)
      .then(content => {
        setAudioContent(content);
        console.log("Restored audio content in form state");
      })
      .catch(error => {
        console.error("Error formatting restored audio:", error);
      });
  }, [formatAudioContent, setAudioContent]);

  return {
    audioBlob,
    audioUrl,
    audioDuration,
    showAudioRecorder,
    setShowAudioRecorder,
    isRecording,
    isInitializing,
    hasPermission,
    previewStream,
    initializeStream: initializeStreamWithAttemptTracking,
    forceInitializeMicrophone,
    startRecording,
    stopRecording: handleStopRecording,
    clearAudio,
    restoreAudio,
    stopMediaStream,
    isStreamActive,
    isInitializationAttempted
  };
}
