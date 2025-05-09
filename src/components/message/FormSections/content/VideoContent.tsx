
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
  const { content } = useMessageForm();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  
  // Extract transcription from content
  useEffect(() => {
    if (content) {
      try {
        const { transcription: extractedTranscription } = parseVideoContent(content);
        if (extractedTranscription) {
          setTranscription(extractedTranscription);
        }
      } catch (e) {
        console.error("Error parsing video content:", e);
      }
    }
  }, [content]);
  
  // Log for debugging
  useEffect(() => {
    console.log("VideoContent: inDialog =", inDialog, 
                "videoUrl =", videoUrl ? "present" : "null",
                "previewStream =", previewStream ? "active" : "null",
                "isRecording =", isRecording,
                "transcription =", transcription);
    
    // If we have a video URL, we should show the video preview
    if (videoUrl) {
      setShowVideoPreview(true);
    }
  }, [inDialog, videoUrl, previewStream, isRecording, transcription]);
  
  // Handle transcription
  const handleTranscribe = async () => {
    setIsTranscribing(true);
    try {
      await onTranscribeVideo();
      toast({
        title: "Transcription completed",
        description: "Video has been transcribed successfully"
      });
      
      // Re-parse content to update transcription after transcribing
      if (content) {
        const { transcription: newTranscription } = parseVideoContent(content);
        setTranscription(newTranscription);
      }
    } catch (error) {
      toast({
        title: "Transcription failed",
        description: "Unable to transcribe the video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTranscribing(false);
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
          isTranscribing={isTranscribing}
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
