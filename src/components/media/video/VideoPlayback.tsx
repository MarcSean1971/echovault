
import React from "react";

interface VideoPlaybackProps {
  recordedVideoRef: React.RefObject<HTMLVideoElement>;
  videoURL: string;
  onEnded: () => void;
}

export function VideoPlayback({ 
  recordedVideoRef, 
  videoURL, 
  onEnded 
}: VideoPlaybackProps) {
  return (
    <div className="w-full aspect-video bg-black rounded-md overflow-hidden">
      <video
        ref={recordedVideoRef}
        src={videoURL}
        className="w-full h-full object-cover"
        onEnded={onEnded}
      />
    </div>
  );
}
