
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
  
  // Wrapper for initialized video handler with improved error handling
  const handleInitializedVideo = (blob: Blob, url: string) => {
    console.log("useMessageTypeManager: Initializing video with blob size:", blob.size, 
                "URL:", url.substring(0, 30) + "...");
    
    if (!blob || blob.size === 0) {
      console.error("Invalid blob in handleInitializedVideo");
      return;
    }
    
    try {
      // Pass initialization to our handler
      handleInitializedVideoBase(blob, url, setInitializedFromMessage, restoreVideo);
      
      // Log success
      console.log("Video initialization processed successfully in useMessageTypeManager");
      
      // Double-check if video was restored by logging current videoUrl
      console.log("Current video URL after initialization:", 
                 videoUrl ? videoUrl.substring(0, 30) + "..." : "null");
    } catch (error) {
      console.error("Error in handleInitializedVideo:", error);
    }
  };
  
  // Wrapper for initialized audio handler with improved error handling
  const handleInitializedAudio = (blob: Blob, url: string) => {
    console.log("useMessageTypeManager: Initializing audio with blob size:", blob.size,
                "URL:", url.substring(0, 30) + "...");
    
    if (!blob || blob.size === 0) {
      console.error("Invalid blob in handleInitializedAudio");
      return;
    }
    
    try {
      handleInitializedAudioBase(blob, url, setInitializedFromMessage, restoreAudio);
      console.log("Audio initialization processed successfully in useMessageTypeManager");
    } catch (error) {
      console.error("Error in handleInitializedAudio:", error);
    }
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
    isAudioInitializationAttempted
  };
}
