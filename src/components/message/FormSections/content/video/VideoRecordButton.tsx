
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";

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
  const [localInitializing, setLocalInitializing] = useState(isInitializing);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sync our local state with incoming prop
  useEffect(() => {
    console.log("VideoRecordButton: isInitializing prop changed to", isInitializing);
    setLocalInitializing(isInitializing);
    
    // If it's no longer initializing, also clear the attempting state
    if (!isInitializing && isAttemptingToRecord) {
      setIsAttemptingToRecord(false);
    }
  }, [isInitializing, isAttemptingToRecord]);
  
  // Clean up timeouts when unmounting
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle initialization timeout with a more robust approach
  useEffect(() => {
    // Clear any existing timeout when states change
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    // If we're initializing or attempting to record, set a new timeout
    if (localInitializing || isAttemptingToRecord) {
      const timeout = setTimeout(() => {
        console.log("Camera initialization timeout reached in button component");
        
        // Reset both states to ensure button becomes clickable again
        setLocalInitializing(false);
        setIsAttemptingToRecord(false);
      }, 12000); // 12 seconds timeout - slightly longer than the MediaStateManager
      
      initTimeoutRef.current = timeout;
    }
    
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [localInitializing, isAttemptingToRecord]);
  
  // Handle the start recording button click
  const handleStartRecordingClick = async () => {
    console.log("Start recording button clicked");
    setIsAttemptingToRecord(true);
    try {
      await onStartRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
      // Reset attempts state on error
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
  if (localInitializing || isAttemptingToRecord) {
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
