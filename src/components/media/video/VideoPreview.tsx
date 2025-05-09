import React, { RefObject } from "react";
import { RecordingIndicator } from "./RecordingIndicator";
import { formatTime } from "@/utils/mediaUtils";

interface VideoPreviewProps {
  videoPreviewRef: RefObject<HTMLVideoElement>;
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  isInitializing: boolean;
  permissionDenied: boolean;
}

export function VideoPreview({
  videoPreviewRef,
  isRecording,
  isPaused,
  recordingDuration,
  isInitializing,
  permissionDenied
}: VideoPreviewProps) {
  return (
    <div className="relative w-full aspect-video bg-gray-100 overflow-hidden rounded-md">
      <video
        ref={videoPreviewRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        muted
        autoPlay
      />
      {(isRecording || isPaused) && !permissionDenied && !isInitializing && (
        <div className="absolute top-2 left-2">
          <RecordingIndicator isRecording={isRecording} isPaused={isPaused} />
          <span className="ml-2 text-sm text-white shadow-md">{formatTime(recordingDuration)}</span>
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded shadow-md">
        Preview
      </div>
    </div>
  );
}
