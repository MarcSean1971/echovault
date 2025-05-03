
import React, { useEffect, useState } from "react";
import { formatDuration } from "@/utils/audioUtils";
import { RecordingIndicator } from "./RecordingIndicator";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";

interface VideoPreviewProps {
  videoPreviewRef: React.RefObject<HTMLVideoElement>;
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
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
  const [streamActive, setStreamActive] = useState(false);
  
  // Check if stream becomes active
  useEffect(() => {
    const videoElem = videoPreviewRef.current;
    if (!videoElem) return;
    
    const checkStream = () => {
      const hasActiveStream = videoElem.srcObject instanceof MediaStream && 
                             (videoElem.srcObject as MediaStream).active;
      setStreamActive(hasActiveStream);
      console.log("Stream active check:", hasActiveStream);
    };
    
    // Initially check if stream exists and is active
    checkStream();
    
    // Add event listeners to detect when video starts playing or metadata loads
    videoElem.addEventListener('playing', checkStream);
    videoElem.addEventListener('loadedmetadata', checkStream);
    
    // Also check when readyState changes
    const readyStateCheck = () => {
      if (videoElem.readyState >= 2) { // HAVE_CURRENT_DATA or better
        checkStream();
      }
    };
    
    videoElem.addEventListener('loadeddata', readyStateCheck);
    
    return () => {
      videoElem.removeEventListener('playing', checkStream);
      videoElem.removeEventListener('loadedmetadata', checkStream);
      videoElem.removeEventListener('loadeddata', readyStateCheck);
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
      
      {/* Permission denied state */}
      {permissionDenied && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center p-4 max-w-xs">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Camera access denied</p>
            <p className="text-xs text-gray-300 mt-1">
              Please check your browser settings and allow camera access to record video
            </p>
          </div>
        </div>
      )}
      
      {/* No camera message - only show when not initializing and camera was attempted */}
      {!isInitializing && !permissionDenied && !streamActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center p-4">
            <p className="text-sm text-white">Camera not available</p>
            <p className="text-xs text-gray-300 mt-1">Please check your camera permissions</p>
          </div>
        </div>
      )}
      
      {/* Recording indicators - only show when stream is active */}
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
