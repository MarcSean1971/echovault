
import React from "react";
import { Button } from "@/components/ui/button";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";
import { formatDuration } from "@/utils/audioUtils";
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
        <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative">
          {!videoURL ? (
            // Live video preview for recording
            <>
              <video 
                ref={videoPreviewRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              {isRecording && (
                <div className="absolute top-2 right-2 flex items-center px-2 py-1 bg-black/50 rounded-full">
                  <div className={`w-2 h-2 rounded-full bg-red-500 mr-1 ${isPaused ? '' : 'animate-pulse'}`} />
                  <span className="text-xs text-white">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
              )}
            </>
          ) : (
            // Recorded video playback
            <video
              ref={recordedVideoRef}
              src={videoURL}
              className="w-full h-full object-cover"
              onEnded={handleVideoEnded}
            />
          )}
        </div>
        
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
