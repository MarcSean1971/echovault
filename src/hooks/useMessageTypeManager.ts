
import { useState, useEffect } from 'react';
import { useVideoRecordingHandler } from './useVideoRecordingHandler';
import { useMessageForm } from '@/components/message/MessageFormContext';

export function useMessageTypeManager() {
  const { setMessageType, videoContent } = useMessageForm();
  const [initializedFromMessage, setInitializedFromMessage] = useState(false);
  
  // Use our custom hooks
  const {
    isRecording,
    isInitializing,
    hasPermission,
    videoBlob,
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    previewStream,
    initializeStream,
    forceInitializeCamera,
    startRecording,
    stopRecording,
    clearVideo,
    restoreVideo,
    stopMediaStream,
    isStreamActive
  } = useVideoRecordingHandler();

  // Handle clicking on text tab
  const onTextTypeClick = () => {
    console.log("Text message type selected");
    setMessageType('text');
    
    // If we were recording, stop
    if (isRecording) {
      stopRecording();
    }
    
    // Stop any active media stream when switching to text mode
    if (isStreamActive()) {
      stopMediaStream();
    }
  };
  
  // Handle clicking on video tab
  const onVideoTypeClick = () => {
    console.log("Video message type selected");
    setMessageType('video');
  };
  
  // Handle initialized video from existing message
  const handleInitializedVideo = (blob: Blob, url: string) => {
    console.log("handleInitializedVideo with blob size:", blob.size);
    setInitializedFromMessage(true);
    restoreVideo(blob, url);
  };

  return {
    onTextTypeClick,
    onVideoTypeClick,
    videoBlob, 
    videoUrl, 
    showVideoRecorder, 
    setShowVideoRecorder,
    isRecording, 
    isInitializing, 
    hasPermission, 
    previewStream,
    initializeStream,
    startRecording,
    stopRecording,
    clearVideo,
    forceInitializeCamera,
    handleInitializedVideo,
    initializedFromMessage
  };
}
