
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
  // Hide permission request by default - we'll check permissions first
  const [showCameraPermissionRequest, setShowCameraPermissionRequest] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
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
    autoInitialize: true // Initialize automatically to check permissions
  });
  
  // Initial check for permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Try to get permissions automatically first
        const result = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            // We got permissions, clean up this temporary stream
            stream.getTracks().forEach(track => track.stop());
            return true;
          })
          .catch(() => false);
          
        // If we couldn't get permissions, show the permission request screen
        if (!result) {
          setShowCameraPermissionRequest(true);
        }
      } catch (error) {
        // On error, show permission request
        setShowCameraPermissionRequest(true);
      } finally {
        setInitializing(false);
      }
    };
    
    // Only check if browser supports media devices
    if (isBrowserSupported) {
      checkPermissions();
    }
  }, [isBrowserSupported]);
  
  const handleRequestCameraAccess = () => {
    setShowCameraPermissionRequest(false);
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
  
  // Show loading spinner while checking permissions
  if (initializing) {
    return (
      <div className="p-4 bg-background rounded-lg border flex items-center justify-center" style={{minHeight: '300px'}}>
        <div className="text-center">
          <Spinner className="mx-auto mb-2" />
          <p className="text-sm">Checking camera access...</p>
        </div>
      </div>
    );
  }
  
  // Show camera permission request screen if needed
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
