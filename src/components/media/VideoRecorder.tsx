
import React from "react";
import { Button } from "@/components/ui/button";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";
import { VideoPreview } from "./video/VideoPreview";
import { VideoPlayback } from "./video/VideoPlayback";
import { RecordingControls } from "./video/RecordingControls";
import { PlaybackControls } from "./video/PlaybackControls";

interface VideoRecorderProps {
  onVideoReady: (videoBlob: Blob, videoBase64: string) => void;
  onCancel: () => void;
}

export function VideoRecorder({ onVideoReady, onCancel }: VideoRecorderProps) {
  const {
    isRecording,
    isPaused,
    isPlaying,
    recordingDuration,
    videoURL,
    videoBlob,
    isBrowserSupported,
    videoPreviewRef,
    recordedVideoRef,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePlayback,
    handleVideoEnded,
    reset,
    handleAccept
  } = useVideoRecorder();
  
  const handleAcceptVideo = async () => {
    if (!videoBlob) return;
    
    const result = await handleAccept();
    if (result) {
      onVideoReady(result.videoBlob, result.base64Video);
    }
  };
  
  if (!isBrowserSupported) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-4">Your browser doesn't support video recording.</p>
        <Button onClick={onCancel} variant="outline">Cancel</Button>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-background rounded-lg border">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Video preview or playback area */}
        {!videoURL ? (
          <VideoPreview
            videoPreviewRef={videoPreviewRef}
            isRecording={isRecording}
            isPaused={isPaused}
            recordingDuration={recordingDuration}
          />
        ) : (
          <VideoPlayback
            recordedVideoRef={recordedVideoRef}
            videoURL={videoURL}
            onEnded={handleVideoEnded}
          />
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
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
