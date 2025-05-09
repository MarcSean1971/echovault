
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useMessageForm } from "../../MessageFormContext";
import { parseMessageTranscription, parseVideoContent } from "@/services/messages/mediaService";
import { useContentUpdater } from "@/hooks/useContentUpdater";

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
  onTranscribeVideo,
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
  onTranscribeVideo: () => Promise<void>;
  inDialog?: boolean;
}) {
  const { content, messageType } = useMessageForm();
  const { isTranscribingVideo, getTranscriptionFromContent } = useContentUpdater();
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(!!videoUrl);
  const [transcription, setTranscription] = useState<string | null>(null);
  
  // Reset showVideoPreview state whenever videoUrl changes or tab changes
  useEffect(() => {
    console.log("VideoContent: videoUrl or messageType changed:", { 
      videoUrl: videoUrl ? "present" : "null", 
      messageType 
    });
    
    // If we have a video URL, we should always show the video preview
    if (videoUrl) {
      console.log("VideoContent: Setting showVideoPreview to true because videoUrl exists");
      setShowVideoPreview(true);
    }
  }, [videoUrl, messageType]);
  
  // Extract transcription from content
  useEffect(() => {
    if (content) {
      const extractedTranscription = getTranscriptionFromContent(content);
      console.log("VideoContent: Extracted transcription from content:", 
                  extractedTranscription ? extractedTranscription.substring(0, 30) + "..." : "none");
      setTranscription(extractedTranscription);
    }
  }, [content, getTranscriptionFromContent]);
  
  // Log for debugging
  useEffect(() => {
    console.log("VideoContent: Rendering state:", { 
      inDialog, 
      videoUrl: videoUrl ? "present" : "null",
      previewStream: previewStream ? "active" : "null",
      isRecording,
      transcription: transcription ? "present" : "null",
      showVideoPreview
    });
  }, [inDialog, videoUrl, previewStream, isRecording, transcription, showVideoPreview]);
  
  // Handle transcription
  const handleTranscribe = async () => {
    try {
      await onTranscribeVideo();
      toast({
        title: "Transcription completed",
        description: "Video has been transcribed successfully"
      });
    } catch (error) {
      toast({
        title: "Transcription failed",
        description: "Unable to transcribe the video. Please try again.",
        variant: "destructive"
      });
    }
  };
  
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
  
  return (
    <div className="space-y-4">
      {!inDialog && <Label htmlFor="videoContent">Video Message</Label>}
      
      {/* Show video player if we have a video URL */}
      {videoUrl && showVideoPreview && (
        <VideoPlayer
          videoUrl={videoUrl}
          transcription={transcription}
          onTranscribe={handleTranscribe}
          isTranscribing={isTranscribingVideo}
          onClearVideo={onClearVideo}
        />
      )}
      
      {/* Show camera preview when we have an active stream */}
      {!videoUrl && previewStream && (
        <CameraPreview
          previewStream={previewStream}
          isRecording={isRecording}
          isInitializing={isInitializing || false}
          onStartRecording={handleStartRecording}
          onStopRecording={onStopRecording}
        />
      )}
      
      {/* Show empty state when there's no video and no preview */}
      {!videoUrl && !previewStream && !isRecording && (
        <EmptyVideoState
          handleStartRecording={handleStartRecording}
          isInitializing={isInitializing || false}
          permissionError={permissionError}
          hasPermission={hasPermission}
          inDialog={inDialog}
        />
      )}
    </div>
  );
}
