
import { useState } from "react";
import { useMediaStream } from "./video/useMediaStream";
import { useVideoRecorder } from "./video/useVideoRecorder";
import { useVideoStorage } from "./video/useVideoStorage";

export function useVideoRecordingHandler() {
  // Use our custom hooks
  const {
    previewStream,
    isInitializing,
    hasPermission,
    streamRef,
    initializeStream,
    stopMediaStream
  } = useMediaStream();
  
  const {
    isRecording,
    videoBlob,
    videoUrl,
    startRecording,
    stopRecording,
    setVideoBlob,
    setVideoUrl
  } = useVideoRecorder(previewStream, streamRef);
  
  const {
    showVideoRecorder,
    setShowVideoRecorder,
    clearVideo: clearVideoBase,
    restoreVideo: restoreVideoBase
  } = useVideoStorage();
  
  // Wrapper function for clearVideo
  const clearVideo = () => {
    clearVideoBase(videoUrl, setVideoBlob, setVideoUrl);
  };
  
  // Wrapper function for restoreVideo
  const restoreVideo = (blob: Blob, url: string) => {
    restoreVideoBase(blob, url, setVideoBlob, setVideoUrl);
  };
  
  return {
    isRecording,
    isInitializing,
    hasPermission,
    videoBlob,
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    previewStream,
    initializeStream,
    startRecording,
    stopRecording,
    clearVideo,
    restoreVideo
  };
}
