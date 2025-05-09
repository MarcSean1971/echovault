
import { AudioRecorderDialog } from "@/components/media/AudioRecorderDialog";
import { VideoRecorderDialog } from "@/components/media/VideoRecorderDialog";

interface MediaRecordersProps {
  showAudioRecorder: boolean;
  setShowAudioRecorder: (show: boolean) => void;
  showVideoRecorder: boolean;
  setShowVideoRecorder: (show: boolean) => void;
  onAudioContentUpdate: (audioBlob: Blob, audioBase64: string) => Promise<any>;
  onVideoContentUpdate: (videoBlob: Blob, videoBase64: string) => Promise<any>;
  audioUrl: string | null;
  audioBlob: Blob | null;
  videoUrl: string | null;
  videoBlob: Blob | null;
}

export function MediaRecorders({ 
  showAudioRecorder, 
  setShowAudioRecorder,
  showVideoRecorder, 
  setShowVideoRecorder,
  onAudioContentUpdate, 
  onVideoContentUpdate,
  audioUrl,
  audioBlob,
  videoUrl,
  videoBlob
}: MediaRecordersProps) {
  return (
    <>
      {/* Audio Recorder Dialog */}
      <AudioRecorderDialog 
        open={showAudioRecorder} 
        onOpenChange={setShowAudioRecorder}
        existingAudioUrl={audioUrl}
        existingAudioBlob={audioBlob}
        onAudioReady={onAudioContentUpdate}
      />
      
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
