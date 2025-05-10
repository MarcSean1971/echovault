
import { useRef, useEffect, useState } from "react";
import { VideoRecordButton } from "./VideoRecordButton";

interface CameraPreviewProps {
  previewStream: MediaStream;
  isRecording: boolean;
  isInitializing: boolean;
  onStartRecording: () => Promise<void>; // Ensuring this is Promise<void>
  onStopRecording: () => void;
}

export function CameraPreview({
  previewStream,
  isRecording,
  isInitializing,
  onStartRecording,
  onStopRecording
}: CameraPreviewProps) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const retryAttemptsRef = useRef(0);
  const maxRetryAttempts = 3;
  
  // Connect preview stream to video element
  useEffect(() => {
    if (previewStream && previewRef.current) {
      console.log("Connecting preview stream to video element");
      
      try {
        previewRef.current.srcObject = previewStream;
        
        // Clear any previous errors when we get a new stream
        setVideoError(null);
        
        // Play the preview (will be silent since we're not enabling audio)
        previewRef.current.play().catch(err => {
          console.error("Error playing preview:", err);
          setVideoError("Could not display camera preview. Please try again.");
          
          // Attempt automatic retry
          if (retryAttemptsRef.current < maxRetryAttempts) {
            retryAttemptsRef.current++;
            const retryTimer = setTimeout(() => {
              console.log(`Retry attempt ${retryAttemptsRef.current}...`);
              if (previewRef.current) {
                previewRef.current.play().catch(retryErr => {
                  console.error(`Retry ${retryAttemptsRef.current} failed:`, retryErr);
                });
              }
            }, 1000); // Wait 1 second before retry
            
            return () => clearTimeout(retryTimer);
          }
        });
        
        // Add event listener to clear error when video plays successfully
        const handlePlaying = () => {
          console.log("Camera preview playing successfully");
          setVideoError(null);
          retryAttemptsRef.current = 0;
        };
        
        previewRef.current.addEventListener('playing', handlePlaying);
        
        return () => {
          if (previewRef.current) {
            previewRef.current.removeEventListener('playing', handlePlaying);
          }
        };
      } catch (err) {
        console.error("Error connecting stream to video element:", err);
        setVideoError("Error connecting to camera. Please refresh and try again.");
      }
    }
    
    return () => {
      if (previewRef.current) {
        previewRef.current.srcObject = null;
      }
    };
  }, [previewStream]);
  
  return (
    <div className="relative rounded-md overflow-hidden bg-black">
      <video 
        ref={previewRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full max-h-[300px]"
      />
      
      {/* Error message */}
      {videoError && (
        <div className="absolute top-0 left-0 right-0 p-2 bg-red-500/80 text-white text-center">
          {videoError}
        </div>
      )}
      
      {/* Recording indicator overlay - only show when recording */}
      {isRecording && (
        <div className="absolute top-0 left-0 right-0 p-2 bg-black/30 flex justify-center">
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="animate-pulse h-3 w-3 rounded-full bg-red-500"></span>
            <span className="text-sm font-medium">Recording in progress...</span>
          </div>
        </div>
      )}
      
      {/* Button controls */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 flex justify-center">
        <VideoRecordButton 
          isRecording={isRecording}
          isInitializing={isInitializing}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
        />
      </div>
    </div>
  );
}
