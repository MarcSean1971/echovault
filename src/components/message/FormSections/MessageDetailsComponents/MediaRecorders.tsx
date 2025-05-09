
import { VideoRecorderDialog } from "@/components/media/VideoRecorderDialog";

interface MediaRecordersProps {
  showVideoRecorder: boolean;
  setShowVideoRecorder: (show: boolean) => void;
  onVideoContentUpdate: (videoBlob: Blob, videoBase64: string) => Promise<any>;
  videoUrl: string | null;
  videoBlob: Blob | null;
}

export function MediaRecorders({ 
  showVideoRecorder, 
  setShowVideoRecorder,
  onVideoContentUpdate,
  videoUrl,
  videoBlob
}: MediaRecordersProps) {
  return (
    <>
      {/* Video Recorder Dialog */}
      <VideoRecorderDialog 
        open={showVideoRecorder} 
        onOpenChange={setShowVideoRecorder}
        existingVideoUrl={videoUrl}
        existingVideoBlob={videoBlob} 
        onVideoReady={onVideoContentUpdate}
      />
    </>
  );
}
