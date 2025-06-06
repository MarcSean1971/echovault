
import { useRef, useEffect } from "react";
import { VideoRecordButton } from "./VideoRecordButton";

interface CameraPreviewProps {
  previewStream: MediaStream;
  isRecording: boolean;
  isInitializing: boolean;
  onStartRecording: () => Promise<void>;
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
  
  // Connect preview stream to video element
  useEffect(() => {
    if (previewStream && previewRef.current) {
      console.log("Connecting preview stream to video element");
      previewRef.current.srcObject = previewStream;
      
      // Play the preview (will be silent since we're not enabling audio)
      previewRef.current.play().catch(err => {
        console.error("Error playing preview:", err);
      });
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
