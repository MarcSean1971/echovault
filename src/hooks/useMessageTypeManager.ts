
import { useVideoRecordingHandler } from './useVideoRecordingHandler';
import { useAudioRecordingHandler } from './useAudioRecordingHandler';
import { useMessageTypeStore } from './message/useMessageTypeStore';
import { useMediaTabSwitcher } from './message/useMediaTabSwitcher';
import { useInitializedMediaHandler } from './message/useInitializedMediaHandler';

export function useMessageTypeManager() {
  // Use our message type store for basic state
  const {
    initializedFromMessage,
    setInitializedFromMessage,
    onTextTypeClick,
    onVideoTypeClick,
    onAudioTypeClick
  } = useMessageTypeStore();
  
  // Use our custom hooks for video and audio handling
  const {
    isRecording: isVideoRecording,
    isInitializing: isVideoInitializing,
    hasPermission: hasVideoPermission,
    videoBlob,
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    previewStream: videoPreviewStream,
    initializeStream: initializeVideoStream,
    forceInitializeCamera,
    startRecording: startVideoRecording,
    stopRecording: stopVideoRecording,
    clearVideo,
    restoreVideo,
    stopMediaStream: stopVideoStream,
    isStreamActive: isVideoStreamActive
  } = useVideoRecordingHandler();

  // Use our audio recording hook
  const {
    isRecording: isAudioRecording,
    isInitializing: isAudioInitializing,
    hasPermission: hasAudioPermission,
    audioBlob,
    audioUrl,
    audioDuration,
    showAudioRecorder,
    setShowAudioRecorder,
    previewStream: audioPreviewStream,
    initializeStream: initializeAudioStream,
    forceInitializeMicrophone,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    clearAudio,
    restoreAudio,
    stopMediaStream: stopAudioStream,
    isStreamActive: isAudioStreamActive,
    transcribeAudio,
    isInitializationAttempted: isAudioInitializationAttempted
  } = useAudioRecordingHandler();

  // Use our media tab switcher for handling tab changes
  const mediaTabSwitcher = useMediaTabSwitcher(
    isVideoRecording,
    stopVideoRecording,
    stopVideoStream,
    isVideoStreamActive,
    isAudioRecording,
    stopAudioRecording,
    stopAudioStream,
    isAudioStreamActive
  );
  
  // Use our initialized media handler
  const {
    handleInitializedVideo: handleInitializedVideoBase,
    handleInitializedAudio: handleInitializedAudioBase
  } = useInitializedMediaHandler();
  
  // Wrapper for initialized video handler
  const handleInitializedVideo = (blob: Blob, url: string) => {
    console.log("useMessageTypeManager: Initializing video with blob size:", blob.size);
    handleInitializedVideoBase(blob, url, setInitializedFromMessage, restoreVideo);
  };
  
  // Wrapper for initialized audio handler
  const handleInitializedAudio = (blob: Blob, url: string) => {
    console.log("useMessageTypeManager: Initializing audio with blob size:", blob.size);
    handleInitializedAudioBase(blob, url, setInitializedFromMessage, restoreAudio);
  };

  return {
    // Common
    initializedFromMessage,
    setInitializedFromMessage,
    
    // Text
    onTextTypeClick,
    
    // Video
    onVideoTypeClick,
    videoBlob, 
    videoUrl, 
    showVideoRecorder, 
    setShowVideoRecorder,
    isVideoRecording, 
    isVideoInitializing, 
    hasVideoPermission, 
    videoPreviewStream,
    initializeVideoStream,
    startVideoRecording,
    stopVideoRecording,
    clearVideo,
    forceInitializeCamera,
    handleInitializedVideo,
    isVideoStreamActive,
    
    // Audio
    onAudioTypeClick,
    audioBlob,
    audioUrl,
    audioDuration,
    showAudioRecorder,
    setShowAudioRecorder,
    isAudioRecording,
    isAudioInitializing,
    hasAudioPermission,
    audioPreviewStream,
    initializeAudioStream,
    startAudioRecording,
    stopAudioRecording,
    clearAudio,
    forceInitializeMicrophone,
    handleInitializedAudio,
    transcribeAudio,
    isAudioInitializationAttempted
  };
}
