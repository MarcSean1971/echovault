
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface VideoRecordButtonProps {
  isRecording: boolean;
  isInitializing: boolean;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
}

export function VideoRecordButton({
  isRecording,
  isInitializing,
  onStartRecording,
  onStopRecording
}: VideoRecordButtonProps) {
  const [isAttemptingToRecord, setIsAttemptingToRecord] = useState(false);
  const [initTimeout, setInitTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Reset attempting state when initialization state changes
  useEffect(() => {
    if (!isInitializing && isAttemptingToRecord) {
      setIsAttemptingToRecord(false);
    }
  }, [isInitializing, isAttemptingToRecord]);
  
  // Handle initialization timeout
  useEffect(() => {
    if (isInitializing) {
      // Set a timeout to reset the initialization state if it takes too long
      const timeout = setTimeout(() => {
        if (isInitializing) {
          console.log("Camera initialization timeout reached");
          setIsAttemptingToRecord(false);
        }
      }, 10000); // 10 seconds timeout
      
      setInitTimeout(timeout);
    }
    
    return () => {
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
    };
  }, [isInitializing]);
  
  // Handle the start recording button click
  const handleStartRecordingClick = async () => {
    setIsAttemptingToRecord(true);
    try {
      await onStartRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsAttemptingToRecord(false);
    }
  };

  // If recording, show stop button
  if (isRecording) {
    return (
      <Button
        type="button"
        onClick={onStopRecording}
        variant="destructive"
        className="hover:bg-destructive/90 transition-colors duration-200"
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
      className="hover:bg-primary/90 transition-colors duration-200"
    >
      <Camera className="mr-2 h-4 w-4" />
      Start Recording
    </Button>
  );
}
