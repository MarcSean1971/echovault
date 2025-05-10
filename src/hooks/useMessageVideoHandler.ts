
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useAudioRecordingHandler } from "./useAudioRecordingHandler";
import { useContentUpdater } from "./useContentUpdater";
import { useMessageInitializer } from "./useMessageInitializer";
import { Message } from "@/types/message";
import { useMessageTypeManager } from "./useMessageTypeManager";
import { useAdditionalTextHandler } from "./message/useAdditionalTextHandler";
import { useMediaInitializer } from "./message/useMediaInitializer";

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
    forceInitializeMicrophone, handleInitializedAudio,
    isAudioInitializationAttempted,
    
    // Common
    initializedFromMessage,
    setInitializedFromMessage
  } = useMessageTypeManager();
  
  const { handleVideoContentUpdate, handleAudioContentUpdate } = useContentUpdater();

  // Initialize message data when editing an existing message
  const { 
    videoUrl: initialVideoUrl, 
    videoBlob: initialVideoBlob,
    audioUrl: initialAudioUrl,
    audioBlob: initialAudioBlob,
    hasInitialized,
    additionalText 
  } = useMessageInitializer(message);
  
  // Handle additional text from message initialization
  useAdditionalTextHandler(additionalText, hasInitialized);
  
  // Connect initialized media to our message type manager
  useMediaInitializer(
    message,
    initialVideoBlob,
    initialVideoUrl,
    initialAudioBlob,
    initialAudioUrl,
    hasInitialized,
    initializedFromMessage,
    setInitializedFromMessage,
    handleInitializedVideo,
    handleInitializedAudio
  );

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
    handleAudioContentUpdate,
    isAudioInitializationAttempted,
    
    onTextTypeClick,
    onVideoTypeClick,
    onAudioTypeClick,
    messageType,
    
    // Include initializedFromMessage in the return object
    initializedFromMessage
  };
}
