
import React from "react";

interface RecordingIndicatorProps {
  isPaused: boolean;
}

export function RecordingIndicator({ isPaused }: RecordingIndicatorProps) {
  return (
    <div className="relative w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center mb-2">
      <div className={`w-12 h-12 rounded-full bg-red-500 ${isPaused ? 'opacity-50' : 'animate-pulse'}`} />
    </div>
  );
}
