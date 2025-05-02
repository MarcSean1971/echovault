
import React from "react";

interface RecordingIndicatorProps {
  isPaused: boolean;
}

export function RecordingIndicator({ isPaused }: RecordingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-black/50 rounded-full">
      <div className={`w-3 h-3 rounded-full bg-red-500 ${isPaused ? '' : 'animate-pulse'}`} />
      <span className="text-xs text-white font-medium">REC</span>
    </div>
  );
}
