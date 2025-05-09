
import React from "react";
import { MutableRefObject } from "react";
import { RecordingIndicator } from "./RecordingIndicator";
import { Spinner } from "@/components/ui/spinner";

interface VideoPreviewProps {
  videoPreviewRef: MutableRefObject<HTMLVideoElement | null>;
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: string;
  isInitializing?: boolean;
  permissionDenied?: boolean;
}

export function VideoPreview({
  videoPreviewRef,
  isRecording,
  isPaused,
  recordingDuration,
  isInitializing = false,
  permissionDenied = false
}: VideoPreviewProps) {
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/10 flex items-center justify-center">
      {/* Video preview element */}
      <video
        ref={videoPreviewRef}
        className={`w-full h-full object-cover ${isInitializing || permissionDenied ? 'opacity-0' : 'opacity-100'}`}
        autoPlay
        muted
        playsInline
      />
      
      {/* Loading indicator */}
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner className="w-8 h-8" />
        </div>
      )}
      
      {/* Recording indicator */}
      {(isRecording || isPaused) && (
        <div className="absolute top-2 right-2">
          <RecordingIndicator 
            isRecording={isRecording} 
            isPaused={isPaused} 
          />
        </div>
      )}
      
      {/* Recording duration */}
      {(isRecording || isPaused) && (
        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm font-mono">
          {recordingDuration}
        </div>
      )}
    </div>
  );
}
