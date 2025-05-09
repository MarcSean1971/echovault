
import { useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useAudioRecordingHandler } from "./useAudioRecordingHandler";
import { useContentUpdater } from "./useContentUpdater";
import { useMessageInitializer } from "./useMessageInitializer";
import { Message } from "@/types/message";
import { useMessageTypeManager } from "./useMessageTypeManager";

export function useMessageVideoHandler(message?: Message) {
  const { messageType } = useMessageForm();
  
  // Use our custom hooks
  const { 
    // Text handling
    onTextTypeClick, 
    
    // Video handling
    onVideoTypeClick,
    videoBlob, videoUrl, showVideoRecorder, setShowVideoRecorder,
    isVideoRecording, isVideoInitializing, hasVideoPermission, videoPreviewStream,
    initializeVideoStream, startVideoRecording, stopVideoRecording, clearVideo,
    forceInitializeCamera, handleInitializedVideo,
    
    // Audio handling
    onAudioTypeClick,
    audioBlob, audioUrl, audioDuration, showAudioRecorder, setShowAudioRecorder,
    isAudioRecording, isAudioInitializing, hasAudioPermission, audioPreviewStream,
    initializeAudioStream, startAudioRecording, stopAudioRecording, clearAudio,
    forceInitializeMicrophone, handleInitializedAudio, transcribeAudio,
    isAudioInitializationAttempted,
    
    initializedFromMessage
  } = useMessageTypeManager();
  
  const { handleVideoContentUpdate, handleAudioContentUpdate } = useContentUpdater();

  // Initialize message data when editing an existing message
  const { 
    videoUrl: initialVideoUrl, 
    videoBlob: initialVideoBlob,
    audioUrl: initialAudioUrl,
    audioBlob: initialAudioBlob,
    hasInitialized 
  } = useMessageInitializer(message);

  // Connect initialized video data to our message type manager
  useEffect(() => {
    if (hasInitialized && initialVideoBlob && initialVideoUrl && !initializedFromMessage) {
      console.log("MessageVideoHandler: Connecting initialized video to message type manager");
      console.log("Initial video blob size:", initialVideoBlob.size);
      
      handleInitializedVideo(initialVideoBlob, initialVideoUrl);
    }
  }, [hasInitialized, initialVideoBlob, initialVideoUrl, handleInitializedVideo, initializedFromMessage]);

  // Connect initialized audio data to our message type manager
  useEffect(() => {
    if (hasInitialized && initialAudioBlob && initialAudioUrl && !initializedFromMessage) {
      console.log("MessageVideoHandler: Connecting initialized audio to message type manager");
      console.log("Initial audio blob size:", initialAudioBlob.size);
      
      handleInitializedAudio(initialAudioBlob, initialAudioUrl);
    }
  }, [hasInitialized, initialAudioBlob, initialAudioUrl, handleInitializedAudio, initializedFromMessage]);

  return {
    videoBlob,
    videoUrl,
    isVideoRecording,
    isVideoInitializing,
    hasVideoPermission,
    videoPreviewStream,
    showVideoRecorder,
    setShowVideoRecorder,
    startVideoRecording,
    stopVideoRecording,
    clearVideo,
    forceInitializeCamera,
    handleVideoContentUpdate,
    
    audioBlob,
    audioUrl,
    audioDuration,
    isAudioRecording,
    isAudioInitializing,
    hasAudioPermission,
    audioPreviewStream,
    showAudioRecorder,
    setShowAudioRecorder,
    startAudioRecording,
    stopAudioRecording,
    clearAudio,
    forceInitializeMicrophone,
    transcribeAudio,
    handleAudioContentUpdate,
    isAudioInitializationAttempted,
    
    onTextTypeClick,
    onVideoTypeClick,
    onAudioTypeClick,
    messageType
  };
}
