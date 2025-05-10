
import { MediaRecorders } from "../MediaRecorders";

interface MediaRecordersDialogProps {
  showVideoRecorder: boolean;
  setShowVideoRecorder: (show: boolean) => void;
  onVideoContentUpdate: (videoBlob: Blob) => Promise<any>;
  videoUrl: string | null;
  videoBlob: Blob | null;
  isVideoRecording: boolean;
  isVideoInitializing: boolean;
  hasVideoPermission: boolean | null;
  videoPreviewStream: MediaStream | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearVideo: () => void;
}

export function MediaRecordersDialog({
  showVideoRecorder,
  setShowVideoRecorder,
  onVideoContentUpdate,
  videoUrl,
  videoBlob,
  isVideoRecording,
  isVideoInitializing,
  hasVideoPermission,
  videoPreviewStream,
  startRecording,
  stopRecording,
  clearVideo
}: MediaRecordersDialogProps) {
  return (
    <MediaRecorders 
      showVideoRecorder={showVideoRecorder}
      setShowVideoRecorder={setShowVideoRecorder}
      onVideoContentUpdate={onVideoContentUpdate}
      videoUrl={videoUrl}
      videoBlob={videoBlob}
      isRecording={isVideoRecording}
      isInitializing={isVideoInitializing}
      hasPermission={hasVideoPermission}
      previewStream={videoPreviewStream}
      startRecording={startRecording}
      stopRecording={stopRecording}
      clearVideo={clearVideo}
    />
  );
}
