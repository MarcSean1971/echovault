
import { useState, useEffect } from 'react';
import { useVideoRecordingHandler } from './useVideoRecordingHandler';
import { useAudioRecordingHandler } from './useAudioRecordingHandler';
import { useMessageForm } from '@/components/message/MessageFormContext';

export function useMessageTypeManager() {
  const { setMessageType, videoContent, audioContent, textContent } = useMessageForm();
  const [initializedFromMessage, setInitializedFromMessage] = useState(false);
  
  // Use our custom hooks
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

  // Handle clicking on text tab
  const onTextTypeClick = () => {
    console.log("Text message type selected");
    setMessageType('text');
    
    // If we were recording video, stop
    if (isVideoRecording) {
      stopVideoRecording();
    }
    
    // If we were recording audio, stop
    if (isAudioRecording) {
      stopAudioRecording();
    }
    
    // Stop any active media streams when switching to text mode
    // but don't clear the content - this is the critical fix
    if (isVideoStreamActive()) {
      console.log("Stopping active video stream when switching to text mode");
      stopVideoStream();
    }
    
    if (isAudioStreamActive()) {
      console.log("Stopping active audio stream when switching to text mode");
      stopAudioStream();
    }
    
    // We do NOT clear the video or audio content here anymore
    // This preserves the content when switching tabs
  };
  
  // Handle clicking on video tab
  const onVideoTypeClick = () => {
    console.log("Video message type selected");
    setMessageType('video');
    
    // If we were recording audio, stop
    if (isAudioRecording) {
      stopAudioRecording();
    }
    
    // Stop any active audio streams when switching to video mode
    if (isAudioStreamActive()) {
      console.log("Stopping active audio stream when switching to video mode");
      stopAudioStream();
    }
    
    // We do NOT clear the audio content here anymore
  };
  
  // Handle clicking on audio tab
  const onAudioTypeClick = () => {
    console.log("Audio message type selected");
    setMessageType('audio');
    
    // If we were recording video, stop
    if (isVideoRecording) {
      stopVideoRecording();
    }
    
    // Stop any active video streams when switching to audio mode
    if (isVideoStreamActive()) {
      console.log("Stopping active video stream when switching to audio mode");
      stopVideoStream();
    }
    
    // We do NOT clear the video content here anymore
  };
  
  // Handle initialized video from existing message
  const handleInitializedVideo = (blob: Blob, url: string) => {
    console.log("handleInitializedVideo with blob size:", blob.size);
    setInitializedFromMessage(true);
    restoreVideo(blob, url);
  };

  // Handle initialized audio from existing message
  const handleInitializedAudio = (blob: Blob, url: string) => {
    console.log("handleInitializedAudio with blob size:", blob.size);
    setInitializedFromMessage(true);
    restoreAudio(blob, url);
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
