
import React from "react";

interface RecordingIndicatorProps {
  isPaused: boolean;
}

export function RecordingIndicator({ isPaused }: RecordingIndicatorProps) {
  return (
    <div className="absolute top-2 right-2 flex items-center px-2 py-1 bg-black/50 rounded-full">
      <div className={`w-2 h-2 rounded-full bg-red-500 mr-1 ${isPaused ? '' : 'animate-pulse'}`} />
    </div>
  );
}
