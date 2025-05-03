
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";
import { VideoPreview } from "./video/VideoPreview";
import { VideoPlayback } from "./video/VideoPlayback";
import { RecordingControls } from "./video/RecordingControls";
import { PlaybackControls } from "./video/PlaybackControls";
import { AlertCircle, RefreshCw } from "lucide-react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface VideoRecorderProps {
  onVideoReady: (videoBlob: Blob, videoBase64: string) => void;
  onCancel: () => void;
}

export function VideoRecorder({ onVideoReady, onCancel }: VideoRecorderProps) {
  const [retryCount, setRetryCount] = useState(0);
  
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
    reinitializeStream
  } = useVideoRecorder();
  
  // Effect to reinitialize stream if needed
  useEffect(() => {
    if (!stream && !videoURL && !isInitializing && retryCount < 2) {
      console.log("No stream detected, attempting to reinitialize");
      const timer = setTimeout(() => {
        reinitializeStream();
        setRetryCount(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [stream, videoURL, isInitializing, reinitializeStream, retryCount]);
  
  const handleRetryCamera = () => {
    setRetryCount(0);
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
          <div className="flex justify-center w-full">
            <Button 
              onClick={handleRetryCamera} 
              variant="outline"
              className={`flex items-center gap-2 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          </div>
        )}
        
        {/* Camera not ready warning */}
        {!streamReady && !isInitializing && !permissionDenied && !videoURL && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-2 w-full">
            <AlertCircle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Camera not connected</p>
              <p className="text-amber-700">
                Please ensure your camera is connected and permissions are granted.
              </p>
            </div>
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
      
      <div className="mt-4 flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          className={HOVER_TRANSITION}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Small focused component for unsupported browsers
function UnsupportedBrowser({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="p-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
      <p className="text-destructive mb-4 font-medium">
        Your browser doesn't support video recording.
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        Please try using Chrome, Firefox, or Edge for the best experience.
      </p>
      <Button 
        onClick={onCancel} 
        variant="outline"
        className={HOVER_TRANSITION}
      >
        Cancel
      </Button>
    </div>
  );
}
