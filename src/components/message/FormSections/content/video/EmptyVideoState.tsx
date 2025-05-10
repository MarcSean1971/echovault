
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useState } from "react";

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
  const [isAttemptingToEnable, setIsAttemptingToEnable] = useState(false);
  
  // Handle the enable camera button click
  const onEnableCamera = async (e: React.MouseEvent) => {
    // Prevent event bubbling to avoid navigation issues
    e.preventDefault();
    e.stopPropagation();
    
    if (isInitializing || isAttemptingToEnable) {
      return;
    }
    
    setIsAttemptingToEnable(true);
    try {
      await handleStartRecording();
    } catch (error) {
      console.error("Error enabling camera:", error);
    } finally {
      setIsAttemptingToEnable(false);
    }
  };
  
  return (
    <div 
      className={`flex flex-col items-center ${!inDialog ? "border-2 border-dashed border-muted-foreground/30" : ""} rounded-md ${inDialog ? "p-4" : "p-6"} space-y-4`}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
    >
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Camera className="h-8 w-8 text-primary" />
      </div>
      
      <div className="text-center">
        <h3 className="font-medium">Record Video Message</h3>
        <p className="text-sm text-muted-foreground">Create a video message to accompany your text</p>
      </div>
      
      {permissionError && (
        <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive max-w-full overflow-auto">
          {permissionError}
        </div>
      )}
      
      {hasPermission === false && (
        <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive max-w-full overflow-auto">
          Camera access was denied. Please check your browser permissions.
        </div>
      )}
      
      <Button
        type="button"
        onClick={onEnableCamera}
        variant="default"
        size={inDialog ? "lg" : "default"}
        disabled={isInitializing || isAttemptingToEnable}
        className="hover:scale-105 hover:opacity-90 transition-all duration-200"
      >
        {(isInitializing || isAttemptingToEnable) ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
