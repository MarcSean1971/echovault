
import { useState } from "react";
import { useMediaStream } from "./video/useMediaStream";
import { useAudioRecorder } from "./audio/useAudioRecorder";
import { useAudioStorage } from "./audio/useAudioStorage";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useAudioRecordingHandler() {
  const { setContent, setAudioContent } = useMessageForm();
  
  // Use our custom hooks with audio configuration
  const {
    previewStream,
    isInitializing,
    hasPermission,
    streamRef,
    initializeStream: initializeVideoStream,
    stopMediaStream,
    isStreamActive
  } = useMediaStream();
  
  // Initialize stream specifically for audio
  const initializeStream = async (forceNew = false) => {
    return initializeVideoStream(forceNew, { audio: true, video: false });
  };
  
  const {
    isRecording,
    audioBlob,
    audioUrl,
    audioDuration,
    startRecording,
    stopRecording,
    setAudioBlob,
    setAudioUrl
  } = useAudioRecorder(previewStream, streamRef);
  
  const {
    showAudioRecorder,
    setShowAudioRecorder,
    clearAudio: clearAudioBase,
    restoreAudio: restoreAudioBase
  } = useAudioStorage();
  
  // Wrapper function for clearAudio
  const clearAudio = () => {
    console.log("useAudioRecordingHandler: Clearing audio");
    clearAudioBase(audioUrl, setAudioBlob, setAudioUrl);
    
    // Clear the audioContent in the form context
    setAudioContent("");
  };
  
  // Wrapper function for restoreAudio
  const restoreAudio = async (blob: Blob, url: string) => {
    console.log("useAudioRecordingHandler: Restoring audio", { 
      hasBlob: !!blob, 
      hasUrl: !!url, 
      blobSize: blob?.size || 0
    });
    
    restoreAudioBase(blob, url, setAudioBlob, setAudioUrl);
    
    // If we have a blob, restore it in the content
    if (blob) {
      try {
        // Format the audio content for the form
        const formattedContent = await formatAudioContent(blob);
        setAudioContent(formattedContent);
        setContent(formattedContent);
      } catch (err) {
        console.error("Error restoring audio content:", err);
      }
    }
  };

  // Format audio content with transcription
  const formatAudioContent = async (blob: Blob): Promise<string> => {
    const base64 = await blobToBase64(blob);
    return JSON.stringify({
      audioData: base64,
      timestamp: new Date().toISOString()
    });
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  
  // Force initialize microphone
  const forceInitializeMicrophone = async () => {
    try {
      console.log("Forcing microphone initialization...");
      await initializeStream(true);
      console.log("Force microphone initialization successful");
      return true;
    } catch (error) {
      console.error("Force microphone initialization failed:", error);
      return false;
    }
  };
  
  // Transcribe audio to text
  const transcribeAudio = async (): Promise<string> => {
    try {
      if (!audioBlob) {
        throw new Error("No audio to transcribe");
      }
      
      console.log("Transcribing audio...");
      
      // This would typically call a server endpoint to transcribe the audio
      // For now, we'll mock this functionality
      return "Audio transcription would appear here. This is placeholder text.";
    } catch (error) {
      console.error("Error transcribing audio:", error);
      return "";
    }
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
    transcribeAudio
  };
}
