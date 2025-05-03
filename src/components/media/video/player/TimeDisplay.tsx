
import React from "react";

interface TimeDisplayProps {
  currentTime: number;
  duration: number;
}

export function TimeDisplay({ currentTime, duration }: TimeDisplayProps) {
  // Format time in MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-xs text-white opacity-90">
      <span>{formatTime(currentTime)}</span>
      <span> / </span>
      <span>{formatTime(duration)}</span>
    </div>
  );
}
