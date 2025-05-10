
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useCallback } from "react";

interface VideoRecordButtonProps {
  isRecording: boolean;
  isInitializing: boolean;
  onStartRecording: () => Promise<void>; // Ensuring this returns Promise<void>
  onStopRecording: () => void;
}

export function VideoRecordButton({
  isRecording,
  isInitializing,
  onStartRecording,
  onStopRecording
}: VideoRecordButtonProps) {
  
  // Handle start recording with added error handling
  const handleStartRecording = useCallback(async () => {
    try {
      await onStartRecording();
    } catch (error) {
      console.error("Error in handleStartRecording:", error);
    }
  }, [onStartRecording]);
  
  if (isRecording) {
    return (
      <Button
        variant="destructive"
        size="lg" // Larger button for mobile touch targets
        onClick={onStopRecording}
        className="hover:scale-105 hover:bg-destructive/90 transition-all duration-200"
      >
        <Square className="h-4 w-4 mr-2" />
        Stop
      </Button>
    );
  }
  
  if (isInitializing) {
    return (
      <Button
        variant="default"
        size="lg" // Larger button for mobile touch targets
        disabled
        className="opacity-70"
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Initializing...
      </Button>
    );
  }
  
  return (
    <Button
      variant="default"
      size="lg" // Larger button for mobile touch targets
      onClick={handleStartRecording}
      className="hover:scale-105 hover:bg-primary/90 transition-all duration-200"
    >
      <Mic className="h-4 w-4 mr-2" />
      Record
    </Button>
  );
}
