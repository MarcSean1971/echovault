
import { useState, useRef, useCallback, useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useAudioManager } from "./audio/useAudioManager";
import { useAudioProcessor } from "./audio/useAudioProcessor";
import { useAudioRecorder } from "./audio/useAudioRecorder";
import { useAudioStorage } from "./audio/useAudioStorage";
import { toast } from "@/components/ui/use-toast";
import { blobToBase64 } from "@/utils/mediaUtils";

export function useAudioRecordingHandler() {
  const { setAudioContent } = useMessageForm();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [initRetryCount, setInitRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
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
    isInitializationAttempted,
    resetInitializationAttempted,
    retryCount
  } = useAudioManager();
  
  const {
    isRecording,
    startRecording: startRecordingInner,
    stopRecording: stopRecordingInner,
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
  
  // Function to update audio content in the form
  const updateAudioContent = useCallback((blob: Blob, duration: number) => {
    console.log("Updating audio content in form with blob size:", blob.size, "and duration:", duration);
    
    // Update local state
    setAudioBlob(blob);
    setAudioDuration(duration);
    
    // Convert blob to base64 and update form state
    blobToBase64(blob).then(base64data => {
      const formattedContent = JSON.stringify({
        audioData: base64data,
        timestamp: new Date().toISOString(),
        duration: duration || 0
      });
      
      console.log("Setting audio content in form state with data length:", base64data.length);
      setAudioContent(formattedContent);
    }).catch(err => {
      console.error("Error converting blob to base64:", err);
    });
  }, [setAudioContent]);
  
  // Initialize stream with better error handling
  const initializeStreamWithSetup = useCallback(async () => {
    try {
      console.log("Initializing audio stream with setup");
      // Reset retry count on fresh initialization
      setInitRetryCount(0);
      return await initializeStream();
    } catch (error) {
      console.error("Error initializing audio stream:", error);
      throw error;
    }
  }, [initializeStream]);
  
  // Enhanced initialization with retries
  const ensureAudioStreamInitialized = useCallback(async () => {
    if (audioBlob || audioUrl) {
      console.log("Audio already initialized with existing content, skipping");
      return true;
    }
    
    console.log("Ensuring audio stream is initialized");
    
    try {
      if (isStreamActive()) {
        console.log("Stream already active, using existing stream");
        return true;
      }
      
      // Reset initialization attempted flag to allow a retry
      resetInitializationAttempted();
      
      // Force initialize microphone
      const success = await forceInitializeMicrophone();
      if (success) {
        console.log("Microphone initialization successful");
        return true;
      }
      
      // If we have retries left, try again
      if (initRetryCount < MAX_RETRIES) {
        const newRetryCount = initRetryCount + 1;
        setInitRetryCount(newRetryCount);
        console.log(`Retry attempt ${newRetryCount}/${MAX_RETRIES}`);
        
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 500));
        return await ensureAudioStreamInitialized();
      }
      
      throw new Error("Failed to initialize microphone after multiple attempts");
    } catch (error) {
      console.error("Error in ensureAudioStreamInitialized:", error);
      
      toast({
        title: "Microphone Error",
        description: "Could not initialize microphone. Please check your browser permissions and device connections.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [
    audioBlob, 
    audioUrl, 
    isStreamActive, 
    forceInitializeMicrophone, 
    resetInitializationAttempted,
    initRetryCount, 
    MAX_RETRIES
  ]);
  
  // Handle recording completed
  const handleRecordingCompleted = useCallback((blob: Blob, url: string, duration: number) => {
    console.log("Audio recording completed. Blob size:", blob.size, "URL:", url.substring(0, 30) + "...", "Duration:", duration);
    
    // Update local state first
    setAudioBlob(blob);
    setAudioUrl(url);
    setAudioDuration(duration);
    
    // Update form content immediately
    updateAudioContent(blob, duration);
    
    // Show confirmation
    toast({
      title: "Audio Recorded",
      description: "Your audio has been recorded successfully."
    });
  }, [updateAudioContent]);
  
  // Start recording wrapper with enhanced initialization
  const startRecording = useCallback(async () => {
    try {
      console.log("Starting audio recording with enhanced initialization");
      
      // Make sure we have an initialized audio stream before recording
      const isInitialized = await ensureAudioStreamInitialized();
      if (!isInitialized) {
        console.error("Cannot start recording: Microphone not ready");
        toast({
          title: "Recording Error",
          description: "Microphone is not ready. Please try again.",
          variant: "destructive"
        });
        return false;
      }
      
      // Pass a callback to update duration
      await startRecordingInner((duration) => {
        setAudioDuration(duration);
      });
      
      return true;
    } catch (error) {
      console.error("Error in startRecording wrapper:", error);
      
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive"
      });
      
      throw error;
    }
  }, [ensureAudioStreamInitialized, startRecordingInner]);
  
  // Enhanced stop recording with content update
  const stopRecording = useCallback(() => {
    console.log("Stopping audio recording with content update");
    
    // Use the enhanced stopRecording with callback
    stopRecordingInner(handleRecordingCompleted);
  }, [stopRecordingInner, handleRecordingCompleted]);
  
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
    blobToBase64(blob).then(base64data => {
      const formattedContent = JSON.stringify({
        audioData: base64data,
        timestamp: new Date().toISOString(),
        duration: duration || 0
      });
      console.log("Restoring audio content in form state");
      setAudioContent(formattedContent);
    }).catch(err => {
      console.error("Error converting blob to base64:", err);
    });
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
    isInitializationAttempted,
    ensureAudioStreamInitialized
  };
}
