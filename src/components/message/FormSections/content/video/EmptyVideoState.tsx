
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Video } from "lucide-react";

interface EmptyVideoStateProps {
  handleStartRecording: () => Promise<void>;
  isInitializing: boolean;
  permissionError: string | null;
  hasPermission: boolean | null;
  inDialog: boolean;
}

export function EmptyVideoState({
  handleStartRecording,
  isInitializing,
  permissionError,
  hasPermission,
  inDialog
}: EmptyVideoStateProps) {
  return (
    <div className={`flex flex-col items-center ${!inDialog ? "border-2 border-dashed border-muted-foreground/30" : ""} rounded-md p-6 space-y-4`}>
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Video className="h-8 w-8 text-primary" />
      </div>
      
      <div className="text-center">
        <h3 className="font-medium">Record Video Message</h3>
        <p className="text-sm text-muted-foreground">Create a video message to accompany your text</p>
      </div>
      
      {permissionError && (
        <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive">
          {permissionError}
        </div>
      )}
      
      {hasPermission === false && (
        <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive">
          Camera access was denied. Please check your browser permissions.
        </div>
      )}
      
      <Button
        type="button"
        onClick={handleStartRecording}
        variant="default"
        disabled={isInitializing}
        className="hover:opacity-90 transition-all"
      >
        {isInitializing ? (
          <>
            <CameraOff className="mr-2 h-4 w-4" />
            Preparing Camera...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Enable Camera
          </>
        )}
      </Button>
    </div>
  );
}
