
import { useState } from "react";
import { VideoContent } from "../content/VideoContent";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface VideoSectionProps {
  messageType: string;
  videoUrl: string | null;
  videoBlob: Blob | null;
  isVideoRecording: boolean;
  isVideoInitializing: boolean;
  hasVideoPermission: boolean | null;
  videoPreviewStream: MediaStream | null;
  startVideoRecording: () => Promise<boolean>;
  stopVideoRecording: () => void;
  clearVideo: () => void;
  handleVideoContentUpdate: (videoBlob: Blob) => Promise<any>;
  showVideoRecorder: boolean;
  setShowVideoRecorder: (show: boolean) => void;
  handleClearVideoAndRecord: () => void;
}

export function VideoSection({
  messageType,
  videoUrl,
  videoBlob,
  isVideoRecording,
  isVideoInitializing,
  hasVideoPermission,
  videoPreviewStream,
  startVideoRecording,
  stopVideoRecording,
  clearVideo,
  handleVideoContentUpdate,
  showVideoRecorder,
  setShowVideoRecorder,
  handleClearVideoAndRecord
}: VideoSectionProps) {
  // Create a wrapper function that explicitly returns Promise<void>
  const handleStartRecordingWrapper = async (): Promise<void> => {
    try {
      // Use void operator to explicitly discard the boolean return value
      void await startVideoRecording();
      // No return statement ensures Promise<void>
    } catch (error) {
      console.error("Error in handleStartRecordingWrapper:", error);
      // No re-throw to maintain Promise<void>
    }
  };

  if (messageType !== "video") return null;

  return (
    <VideoContent
      videoUrl={videoUrl}
      isRecording={isVideoRecording}
      isInitializing={isVideoInitializing}
      hasPermission={hasVideoPermission}
      previewStream={videoPreviewStream}
      onStartRecording={handleStartRecordingWrapper}
      onStopRecording={stopVideoRecording}
      onClearVideo={handleClearVideoAndRecord}
      inDialog={false}
    />
  );
}
