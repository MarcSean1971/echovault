
import React, { useState } from "react";
import { useVideoRecorder } from "@/hooks/video";
import { VideoPreview } from "./video/VideoPreview";
import { VideoPlayback } from "./video/VideoPlayback";
import { RecordingControls } from "./video/RecordingControls";
import { PlaybackControls } from "./video/PlaybackControls";
import { CameraPermissionRequest } from "./video/CameraPermissionRequest";
import { UnsupportedBrowser } from "./video/UnsupportedBrowser";
import { VideoRecorderFooter } from "./video/VideoRecorderFooter";
import { PermissionRetryButton } from "./video/PermissionRetryButton";
import { CameraNotReadyWarning } from "./video/CameraNotReadyWarning";

interface VideoRecorderProps {
  onVideoReady: (videoBlob: Blob, videoBase64: string) => void;
  onCancel: () => void;
}

export function VideoRecorder({ onVideoReady, onCancel }: VideoRecorderProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [showCameraPermissionRequest, setShowCameraPermissionRequest] = useState(true);
  
  const {
    // State
    isRecording,
    isPaused,
    isPlaying,
    recordingDuration,
    videoURL,
    videoBlob,
    isBrowserSupported,
    isInitializing,
    streamReady,
    stream,
    permissionDenied,
    
    // Refs
    videoPreviewRef,
    recordedVideoRef,
    
    // Methods
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePlayback,
    handleVideoEnded,
    reset,
    handleAccept,
    initializeStream,
    reinitializeStream
  } = useVideoRecorder({
    autoInitialize: false // Don't initialize automatically
  });
  
  const handleRequestCameraAccess = () => {
    setShowCameraPermissionRequest(false);
    initializeStream();
  };
  
  const handleRetryCamera = () => {
    setRetryCount(prev => prev + 1);
    reinitializeStream();
  };
  
  const handleAcceptVideo = async () => {
    const result = await handleAccept();
    if (result) {
      onVideoReady(result.videoBlob, result.base64Video);
    }
  };
  
  if (!isBrowserSupported) {
    return <UnsupportedBrowser onCancel={onCancel} />;
  }
  
  // Show camera permission request screen
  if (showCameraPermissionRequest) {
    return <CameraPermissionRequest 
      onRequestAccess={handleRequestCameraAccess} 
      onCancel={onCancel} 
    />;
  }
  
  return (
    <div className="p-4 bg-background rounded-lg border">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Video display area */}
        {!videoURL ? (
          <VideoPreview
            videoPreviewRef={videoPreviewRef}
            isRecording={isRecording}
            isPaused={isPaused}
            recordingDuration={recordingDuration}
            isInitializing={isInitializing}
            permissionDenied={permissionDenied}
          />
        ) : (
          <VideoPlayback
            recordedVideoRef={recordedVideoRef}
            videoURL={videoURL}
            onEnded={handleVideoEnded}
          />
        )}
        
        {/* Permission denied retry button */}
        {permissionDenied && !videoURL && (
          <PermissionRetryButton onRetry={handleRetryCamera} />
        )}
        
        {/* Camera not ready warning */}
        {!streamReady && !isInitializing && !permissionDenied && !videoURL && (
          <CameraNotReadyWarning />
        )}
        
        {/* Controls */}
        {!videoURL ? (
          <RecordingControls
            isRecording={isRecording}
            isPaused={isPaused}
            onStart={startRecording}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onStop={stopRecording}
          />
        ) : (
          <PlaybackControls 
            isPlaying={isPlaying}
            recordingDuration={recordingDuration}
            onTogglePlayback={togglePlayback}
            onReset={reset}
            onAccept={handleAcceptVideo}
          />
        )}
      </div>
      
      <VideoRecorderFooter onCancel={onCancel} />
    </div>
  );
}
