
import React from "react";
import { formatDuration } from "@/utils/audioUtils";
import { RecordingIndicator } from "./RecordingIndicator";

interface VideoPreviewProps {
  videoPreviewRef: React.RefObject<HTMLVideoElement>;
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
}

export function VideoPreview({ 
  videoPreviewRef, 
  isRecording, 
  isPaused,
  recordingDuration 
}: VideoPreviewProps) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
      <video 
        ref={videoPreviewRef} 
        autoPlay 
        playsInline 
        muted 
        className="w-full h-full object-cover"
      />
      
      {isRecording && (
        <>
          <div className="absolute top-2 left-2 z-10">
            <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">
              {formatDuration(recordingDuration)}
            </span>
          </div>
          <div className="absolute top-2 right-2 z-10">
            <RecordingIndicator isPaused={isPaused} />
          </div>
        </>
      )}
    </div>
  );
}
