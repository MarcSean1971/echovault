
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../../MessageFormContext";

// Import our component modules
import { VideoPlayer } from "./video/VideoPlayer";
import { CameraPreview } from "./video/CameraPreview";
import { EmptyVideoState } from "./video/EmptyVideoState";

export function VideoContent({ 
  videoUrl,
  isRecording,
  isInitializing,
  hasPermission,
  previewStream,
  onStartRecording,
  onStopRecording,
  onClearVideo,
  inDialog = false
}: {
  videoUrl: string | null;
  isRecording: boolean;
  isInitializing?: boolean;
  hasPermission?: boolean | null;
  previewStream?: MediaStream | null;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onClearVideo: () => void;
  inDialog?: boolean;
}) {
  const { messageType } = useMessageForm();
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log("VideoContent: Rendering with state:", { 
      hasVideoUrl: !!videoUrl,
      videoUrl: videoUrl ? videoUrl.substring(0, 30) + "..." : null,
      messageType,
      isRecording
    });
  }, [videoUrl, messageType, isRecording]);
  
  // Handle recording errors
  const handleStartRecording = async (): Promise<void> => {
    setPermissionError(null);
    try {
      await onStartRecording();
    } catch (error: any) {
      console.error("Error starting recording:", error);
      setPermissionError(error.message || "Unable to access camera");
    }
  };
  
  // Decide what to render based on current state with priority on showing existing videos
  const renderContent = () => {
    // First priority: Always show existing video if available
    if (videoUrl) {
      return (
        <VideoPlayer
          videoUrl={videoUrl}
          onClearVideo={onClearVideo}
          inDialog={inDialog}
        />
      );
    }
    
    // Second priority: Show camera preview when recording or stream is available
    if (isRecording || previewStream) {
      return (
        <CameraPreview
          previewStream={previewStream}
          isRecording={isRecording}
          isInitializing={!!isInitializing}
          onStartRecording={handleStartRecording}
          onStopRecording={onStopRecording}
          inDialog={inDialog}
        />
      );
    }
    
    // Default to empty state when no video or camera is active
    return (
      <EmptyVideoState
        handleStartRecording={handleStartRecording}
        isInitializing={!!isInitializing}
        permissionError={permissionError}
        hasPermission={hasPermission}
        inDialog={inDialog}
      />
    );
  };
  
  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      {!inDialog && <Label htmlFor="videoContent">Video Message</Label>}
      {renderContent()}
    </div>
  );
}
