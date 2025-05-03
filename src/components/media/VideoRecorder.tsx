
import React, { useState, useEffect } from "react";
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
import { Spinner } from "@/components/ui/spinner";

interface VideoRecorderProps {
  onVideoReady: (videoBlob: Blob, videoBase64: string) => void;
  onCancel: () => void;
}

export function VideoRecorder({ onVideoReady, onCancel }: VideoRecorderProps) {
  // Simplify the permission flow: we'll let the hook handle initialization
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  
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
    // Don't auto-initialize - we'll handle this more carefully
    autoInitialize: false
  });
  
  // Handle initial camera setup
  useEffect(() => {
    const setupCamera = async () => {
      console.log("Setting up camera initially");
      
      // If not supported, don't try to initialize
      if (!isBrowserSupported) return;
      
      // Try to initialize the stream
      const result = await initializeStream();
      
      // If initialization failed, show the permission request screen
      if (!result) {
        console.log("Initial camera setup failed, showing permission request");
        setShowPermissionRequest(true);
      }
    };
    
    setupCamera();
  }, [isBrowserSupported, initializeStream]);
  
  const handleRequestCameraAccess = () => {
    setShowPermissionRequest(false);
    initializeStream();
  };
  
  const handleRetryCamera = () => {
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
  
  // Show camera permission request screen if needed
  if (showPermissionRequest || permissionDenied) {
    return <CameraPermissionRequest 
      onRequestAccess={handleRequestCameraAccess} 
      onCancel={onCancel} 
    />;
  }
  
  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="p-4 bg-background rounded-lg border flex items-center justify-center" style={{minHeight: '300px'}}>
        <div className="text-center">
          <Spinner className="mx-auto mb-2" />
          <p className="text-sm">Connecting to camera...</p>
        </div>
      </div>
    );
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
        
        {/* Camera not ready warning */}
        {!streamReady && !isInitializing && !videoURL && (
          <div className="flex flex-col w-full gap-2">
            <CameraNotReadyWarning />
            <PermissionRetryButton onRetry={handleRetryCamera} />
          </div>
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
