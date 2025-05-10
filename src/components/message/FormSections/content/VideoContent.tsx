
import { useState, useEffect, useRef } from "react";
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
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const mountedRef = useRef(true);
  
  // Set up mounted ref for cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Log initial props for debugging
  useEffect(() => {
    console.log("VideoContent: Initial props:", { 
      hasVideoUrl: !!videoUrl, 
      videoUrl: videoUrl ? videoUrl.substring(0, 30) + "..." : null,
      messageType,
      isRecording,
      isInitializing: isInitializing ? "yes" : "no",
      hasPermission: hasPermission === null ? "unknown" : hasPermission ? "yes" : "no",
      hasPreviewStream: !!previewStream
    });
  }, []);
  
  // Reset showVideoPreview state whenever videoUrl changes or messageType changes
  useEffect(() => {
    console.log("VideoContent: States updated:", { 
      hasVideoUrl: !!videoUrl, 
      videoUrl: videoUrl ? videoUrl.substring(0, 30) + "..." : null,
      messageType,
      previewStream: previewStream ? "active" : "null",
      isInitializing: isInitializing ? "yes" : "no"
    });
    
    // CRITICAL: Always prioritize showing existing video content
    if (videoUrl) {
      console.log("VideoContent: Setting showVideoPreview to true because videoUrl exists");
      setShowVideoPreview(true);
    } else if (previewStream) {
      // Show camera preview if we have a stream but no recorded video
      console.log("VideoContent: Setting showVideoPreview to true because previewStream exists");
      setShowVideoPreview(true);
    } else {
      // When videoUrl and previewStream are both null, reset showVideoPreview for rendering empty state
      console.log("VideoContent: No videoUrl or previewStream, showing empty state");
      setShowVideoPreview(false);
    }
  }, [videoUrl, messageType, previewStream, isInitializing]);
  
  // Handle recording with better error handling
  const handleStartRecording = async (): Promise<void> => {
    setPermissionError(null);
    try {
      console.log("Starting recording...");
      await onStartRecording();
      console.log("Recording started successfully");
    } catch (error: any) {
      console.error("Error starting recording:", error);
      if (mountedRef.current) {
        setPermissionError(error.message || "Unable to access camera or microphone");
      }
    }
  };
  
  // Determine what to render based on current state
  const renderVideoContent = () => {
    console.log("VideoContent: Rendering with state:", {
      hasVideoUrl: !!videoUrl,
      hasPreviewStream: !!previewStream,
      isRecording,
      showVideoPreview
    });
    
    // First priority: show recorded video if available
    if (videoUrl) {
      console.log("VideoContent: Rendering VideoPlayer with URL:", videoUrl.substring(0, 30) + "...");
      return (
        <VideoPlayer
          videoUrl={videoUrl}
          onClearVideo={onClearVideo}
          inDialog={inDialog}
        />
      );
    }
    
    // Second priority: show camera preview if available or recording
    if (previewStream || isRecording) {
      console.log("VideoContent: Rendering CameraPreview");
      return (
        <CameraPreview
          previewStream={previewStream}
          isRecording={isRecording}
          isInitializing={isInitializing || false}
          onStartRecording={handleStartRecording}
          onStopRecording={onStopRecording}
          inDialog={inDialog}
        />
      );
    }
    
    // Default to empty state
    console.log("VideoContent: Rendering EmptyVideoState");
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
  
  // Prevent clicks on this component from causing navigation
  const preventNavigation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div className="space-y-4" onClick={preventNavigation}>
      {!inDialog && <Label htmlFor="videoContent">Video Message</Label>}
      {renderVideoContent()}
    </div>
  );
}
