
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

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
  return (
    <>
      {!isRecording ? (
        <Button
          type="button"
          onClick={onStartRecording}
          variant="default"
          disabled={isInitializing}
          className="hover:bg-primary/90 transition-colors"
        >
          <Camera className="mr-2 h-4 w-4" />
          {isInitializing ? "Preparing..." : "Start Recording"}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onStopRecording}
          variant="destructive"
          className="hover:bg-destructive/90 transition-colors"
        >
          <CameraOff className="mr-2 h-4 w-4" />
          Stop Recording
        </Button>
      )}
    </>
  );
}
