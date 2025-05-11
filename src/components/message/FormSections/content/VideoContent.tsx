
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useMessageForm } from "../../MessageFormContext";
import { parseVideoContent } from "@/services/messages/mediaService";

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
  const { content, messageType } = useMessageForm();
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(!!videoUrl);
  
  // Reset showVideoPreview state whenever videoUrl changes or messageType changes
  useEffect(() => {
    console.log("VideoContent: videoUrl changed:", { 
      videoUrl: videoUrl ? "present" : "null", 
      messageType,
      previewStream: previewStream ? "active" : "null"
    });
    
    // If we have a video URL, we should always show the video preview
    if (videoUrl) {
      console.log("VideoContent: Setting showVideoPreview to true because videoUrl exists");
      setShowVideoPreview(true);
    } else {
      // When videoUrl becomes null, reset showVideoPreview for rendering empty state
      console.log("VideoContent: No videoUrl, checking if previewStream exists");
      if (!previewStream) {
        setShowVideoPreview(false);
      }
    }
  }, [videoUrl, messageType, previewStream]);
  
  // Log for debugging
  useEffect(() => {
    console.log("VideoContent: Rendering state:", { 
      inDialog, 
      videoUrl: videoUrl ? "present" : "null",
      previewStream: previewStream ? "active" : "null",
      isRecording,
      showVideoPreview,
      messageType,
      content: content ? "present" : "none"
    });
  }, [inDialog, videoUrl, previewStream, isRecording, showVideoPreview, messageType, content]);
  
  // Handle recording with better error handling
  const handleStartRecording = async () => {
    setPermissionError(null);
    try {
      console.log("Starting recording...");
      await onStartRecording();
      console.log("Recording started successfully");
    } catch (error: any) {
      console.error("Error starting recording:", error);
      setPermissionError(error.message || "Unable to access camera or microphone");
    }
  };
  
  // Determine what to render based on current state
  const renderVideoContent = () => {
    if (videoUrl && showVideoPreview) {
      return (
        <VideoPlayer
          videoUrl={videoUrl}
          onClearVideo={onClearVideo}
        />
      );
    }
    
    if (!videoUrl && previewStream) {
      return (
        <CameraPreview
          previewStream={previewStream}
          isRecording={isRecording}
          isInitializing={isInitializing || false}
          onStartRecording={handleStartRecording}
          onStopRecording={onStopRecording}
        />
      );
    }
    
    // Default to empty state
    return (
      <EmptyVideoState
        handleStartRecording={handleStartRecording}
        isInitializing={isInitializing || false}
        permissionError={permissionError}
        hasPermission={hasPermission}
        inDialog={inDialog}
      />
    );
  };
  
  return (
    <div className="space-y-4">
      {!inDialog && <Label htmlFor="videoContent">Video Message</Label>}
      {renderVideoContent()}
    </div>
  );
}
