
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { useState } from "react";

interface VideoRecordButtonProps {
  isRecording: boolean;
  isInitializing: boolean;
  onStartRecording: () => Promise<boolean | void>;
  onStopRecording: () => void;
}

export function VideoRecordButton({
  isRecording,
  isInitializing,
  onStartRecording,
  onStopRecording
}: VideoRecordButtonProps) {
  const [isAttemptingToRecord, setIsAttemptingToRecord] = useState(false);
  
  // Handle the start recording button click
  const handleStartRecordingClick = async (e: React.MouseEvent) => {
    // Prevent navigation or bubbling
    e.preventDefault();
    e.stopPropagation();
    
    if (isInitializing || isAttemptingToRecord) return;
    
    setIsAttemptingToRecord(true);
    try {
      await onStartRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
    } finally {
      setIsAttemptingToRecord(false);
    }
  };
  
  // Handle the stop recording button click
  const handleStopRecordingClick = (e: React.MouseEvent) => {
    // Prevent navigation or bubbling
    e.preventDefault();
    e.stopPropagation();
    
    onStopRecording();
  };

  // If recording, show stop button
  if (isRecording) {
    return (
      <Button
        type="button"
        onClick={handleStopRecordingClick}
        variant="destructive"
        className="transition-all duration-200 hover:scale-105 hover:bg-destructive/90"
      >
        <CameraOff className="mr-2 h-4 w-4" />
        Stop Recording
      </Button>
    );
  }
  
  // If initializing or attempting to record, show loading state
  if (isInitializing || isAttemptingToRecord) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled
        className="cursor-not-allowed"
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Preparing Camera...
      </Button>
    );
  }
  
  // Default state: ready to record
  return (
    <Button
      type="button"
      onClick={handleStartRecordingClick}
      variant="default"
      className="transition-all duration-200 hover:scale-105 hover:bg-primary/90"
    >
      <Camera className="mr-2 h-4 w-4" />
      Start Recording
    </Button>
  );
}
