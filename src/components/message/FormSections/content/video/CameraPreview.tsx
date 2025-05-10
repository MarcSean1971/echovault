
import { useRef, useEffect } from "react";
import { VideoRecordButton } from "./VideoRecordButton";

interface CameraPreviewProps {
  previewStream: MediaStream | null;
  isRecording: boolean;
  isInitializing: boolean;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  inDialog?: boolean;
}

export function CameraPreview({ 
  previewStream, 
  isRecording,
  isInitializing,
  onStartRecording,
  onStopRecording,
  inDialog = false
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Connect the stream to the video element
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && previewStream) {
      console.log("Connecting stream to video element");
      videoElement.srcObject = previewStream;
      
      // Play the video
      videoElement.play().catch(e => {
        console.error("Error playing video stream:", e);
      });
    }
    
    // Clean up on unmount or stream change
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [previewStream]);

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-md overflow-hidden">
        {/* Camera preview */}
        <video 
          ref={videoRef}
          className={`w-full ${inDialog ? "max-h-[50vh]" : "max-h-[300px]"}`}
          muted
          playsInline // Critical for iOS
          autoPlay={true}
        />
        
        {/* Record indicator */}
        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center space-x-2 bg-black/50 backdrop-blur-sm p-2 rounded-full">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-white text-xs font-medium">Recording</span>
          </div>
        )}
        
        {/* Record button */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <VideoRecordButton
            isRecording={isRecording}
            isInitializing={isInitializing}
            onStartRecording={onStartRecording}
            onStopRecording={onStopRecording}
          />
        </div>
      </div>
    </div>
  );
}
