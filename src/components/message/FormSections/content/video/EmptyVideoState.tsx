
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2, Video } from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
  const [localInitializing, setLocalInitializing] = useState(isInitializing);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sync with parent's initialization state
  useEffect(() => {
    console.log("EmptyVideoState: isInitializing prop changed to", isInitializing);
    setLocalInitializing(isInitializing);
    
    // If no longer initializing, also reset attempting state
    if (!isInitializing && isAttemptingToEnable) {
      setIsAttemptingToEnable(false);
    }
  }, [isInitializing, isAttemptingToEnable]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);
  
  // Set up timeout for initialization states
  useEffect(() => {
    // Clear any existing timeout when states change
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    // If we're initializing or attempting to enable, set a new timeout
    if (localInitializing || isAttemptingToEnable) {
      const timeout = setTimeout(() => {
        console.log("Camera initialization timeout reached in EmptyVideoState component");
        setLocalInitializing(false);
        setIsAttemptingToEnable(false);
      }, 12000); // 12 seconds timeout
      
      initTimeoutRef.current = timeout;
    }
  }, [localInitializing, isAttemptingToEnable]);
  
  // Handle the enable camera button click with better state management
  const onEnableCamera = async () => {
    if (localInitializing || isAttemptingToEnable) {
      console.log("Already initializing or attempting, ignoring click");
      return;
    }
    
    console.log("Enable camera button clicked");
    setIsAttemptingToEnable(true);
    try {
      await handleStartRecording();
    } catch (error) {
      console.error("Error enabling camera:", error);
      // Reset on error
      setIsAttemptingToEnable(false);
    }
  };
  
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
        onClick={onEnableCamera}
        variant="default"
        disabled={localInitializing || isAttemptingToEnable}
        className="hover:opacity-90 transition-opacity duration-200"
      >
        {(localInitializing || isAttemptingToEnable) ? (
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
