
import React, { useEffect, useState } from "react";
import { formatDuration } from "@/utils/audioUtils";
import { RecordingIndicator } from "./RecordingIndicator";
import { Spinner } from "@/components/ui/spinner";

interface VideoPreviewProps {
  videoPreviewRef: React.RefObject<HTMLVideoElement>;
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  isInitializing?: boolean;
}

export function VideoPreview({ 
  videoPreviewRef, 
  isRecording, 
  isPaused,
  recordingDuration,
  isInitializing = false
}: VideoPreviewProps) {
  const [streamActive, setStreamActive] = useState(false);
  
  // Check if stream becomes active
  useEffect(() => {
    const videoElem = videoPreviewRef.current;
    if (!videoElem) return;
    
    const checkStream = () => {
      const hasStream = videoElem.srcObject instanceof MediaStream;
      setStreamActive(hasStream);
    };
    
    // Initially check if stream exists
    checkStream();
    
    // Add event listeners to detect when video starts playing
    videoElem.addEventListener('playing', checkStream);
    videoElem.addEventListener('loadedmetadata', checkStream);
    
    return () => {
      videoElem.removeEventListener('playing', checkStream);
      videoElem.removeEventListener('loadedmetadata', checkStream);
    };
  }, [videoPreviewRef]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
      {/* Camera preview */}
      <video 
        ref={videoPreviewRef} 
        autoPlay 
        playsInline 
        muted 
        className="w-full h-full object-cover"
      />
      
      {/* Loading state */}
      {isInitializing && !streamActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <Spinner className="mx-auto mb-2" />
            <p className="text-sm text-white">Initializing camera...</p>
          </div>
        </div>
      )}
      
      {/* No camera message */}
      {!isInitializing && !streamActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center p-4">
            <p className="text-sm text-white">Camera not available</p>
            <p className="text-xs text-gray-300 mt-1">Please check your camera permissions</p>
          </div>
        </div>
      )}
      
      {/* Recording indicators */}
      {isRecording && streamActive && (
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
