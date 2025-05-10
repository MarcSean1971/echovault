
import { VideoContent } from "../content/VideoContent";

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
  isVideoRecording,
  isVideoInitializing,
  hasVideoPermission,
  videoPreviewStream,
  startVideoRecording,
  stopVideoRecording,
  handleClearVideoAndRecord
}: VideoSectionProps) {
  // Create a wrapper function that explicitly returns Promise<void>
  const handleStartRecordingWrapper = async (): Promise<void> => {
    try {
      await startVideoRecording();
    } catch (error) {
      console.error("Error in handleStartRecordingWrapper:", error);
    }
  };

  // Only render when message type is video
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
