
import { useState, useRef, useEffect } from "react";
import { useMediaStream } from "./video/useMediaStream";
import { useAudioRecorder } from "./audio/useAudioRecorder";
import { useAudioStorage } from "./audio/useAudioStorage";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { toast } from "@/components/ui/use-toast";

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
  
  // Track whether we've already attempted initialization to prevent loops
  const [isInitializationAttempted, setIsInitializationAttempted] = useState(false);
  const initializationAttemptedRef = useRef(false);
  
  // Initialize stream specifically for audio
  const initializeStream = async (forceNew = false) => {
    try {
      console.log("Audio recorder: initializing audio stream with forceNew =", forceNew);
      
      // Set attempted flag immediately to prevent multiple rapid attempts
      setIsInitializationAttempted(true);
      initializationAttemptedRef.current = true;
      
      // Always force new when explicitly requesting a new stream
      return await initializeVideoStream(forceNew, { audio: true, video: false });
    } catch (err) {
      console.error("Audio recorder: failed to initialize audio stream:", err);
      throw err;
    }
  };
  
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
    clearAudio: clearAudioBase,
    restoreAudio: restoreAudioBase
  } = useAudioStorage();
  
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
  
  // Wrapper function for clearAudio
  const clearAudio = () => {
    console.log("useAudioRecordingHandler: Clearing audio");
    
    // First stop recording if it's ongoing
    if (isRecording) {
      try {
        stopRecording();
      } catch (e) {
        console.error("Error stopping recording while clearing:", e);
      }
    }
    
    clearAudioBase(audioUrl, setAudioBlob, setAudioUrl);
    
    // Clean up recorder resources
    cleanupResources();
    
    // Clear the audioContent in the form context
    setAudioContent("");
    
    // Reset initialization tracking when clearing
    setIsInitializationAttempted(false);
    initializationAttemptedRef.current = false;
    
    // Stop any active audio streams when clearing
    if (isStreamActive()) {
      stopMediaStream();
    }
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
    
    // Mark initialization as attempted since we've restored content
    setIsInitializationAttempted(true);
    initializationAttemptedRef.current = true;
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
  
  // Force initialize microphone with enhanced error handling
  const forceInitializeMicrophone = async () => {
    try {
      // Set the flag to prevent re-initialization
      setIsInitializationAttempted(true);
      initializationAttemptedRef.current = true;
      
      // Make sure any existing streams are stopped first
      if (isStreamActive()) {
        console.log("Stopping existing media stream before microphone initialization");
        stopMediaStream();
      }
      
      console.log("Forcing microphone initialization...");
      
      // Request a new stream with audio only
      await initializeStream(true);
      console.log("Force microphone initialization successful");
      return true;
    } catch (error: any) {
      console.error("Force microphone initialization failed:", error);
      
      // Provide user feedback on common errors
      let errorMessage = "Could not initialize microphone";
      
      if (error.name === "NotAllowedError" || error.message?.includes("permission")) {
        errorMessage = "Microphone access was denied. Please check your browser permissions.";
      } else if (error.name === "NotFoundError" || error.message?.includes("not found")) {
        errorMessage = "No microphone found. Please check your device connections.";
      } else if (error.name === "NotReadableError" || error.name === "AbortError") {
        errorMessage = "Your microphone is being used by another application. Please close other apps that might be using it.";
      }
      
      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive"
      });
      
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
    transcribeAudio,
    isInitializationAttempted
  };
}
