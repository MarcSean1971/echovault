
import { useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useContentUpdater } from "./useContentUpdater";
import { useMessageInitializer } from "./useMessageInitializer";
import { Message } from "@/types/message";

export function useMessageVideoHandler(message?: Message) {
  const { messageType } = useMessageForm();
  
  // Use our custom hooks
  const { 
    onTextTypeClick, onVideoTypeClick,
    videoBlob, videoUrl, showVideoRecorder, setShowVideoRecorder,
    isRecording, isInitializing, hasPermission, previewStream,
    initializeStream, startRecording, stopRecording, clearVideo,
    forceInitializeCamera, handleInitializedVideo, initializedFromMessage
  } = useMessageTypeManager();
  
  const { handleVideoContentUpdate } = useContentUpdater();

  // Initialize message data when editing an existing message
  const { videoUrl: initialVideoUrl, videoBlob: initialVideoBlob, hasInitialized } = useMessageInitializer(message);

  // Connect initialized video data to our message type manager
  useEffect(() => {
    if (hasInitialized && initialVideoBlob && initialVideoUrl && !initializedFromMessage) {
      console.log("MessageVideoHandler: Connecting initialized video to message type manager");
      console.log("Initial video blob size:", initialVideoBlob.size);
      
      handleInitializedVideo(initialVideoBlob, initialVideoUrl);
    }
  }, [hasInitialized, initialVideoBlob, initialVideoUrl, handleInitializedVideo, initializedFromMessage]);

  return {
    videoBlob,
    videoUrl,
    isRecording,
    isInitializing,
    hasPermission,
    previewStream,
    showVideoRecorder,
    setShowVideoRecorder,
    startRecording,
    stopRecording,
    clearVideo,
    forceInitializeCamera,
    handleVideoContentUpdate,
    onTextTypeClick,
    onVideoTypeClick,
    messageType
  };
}

import { useMessageTypeManager } from "./useMessageTypeManager";
