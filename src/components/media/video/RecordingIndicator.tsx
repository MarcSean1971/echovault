
import React from "react";

interface RecordingIndicatorProps {
  isPaused: boolean;
}

export function RecordingIndicator({ isPaused }: RecordingIndicatorProps) {
  return (
    <div className="w-2 h-2 rounded-full bg-red-500 mr-1 flex-shrink-0 flex-grow-0" 
      style={{ animation: isPaused ? 'none' : 'pulse 1s infinite' }}
    />
  );
}
