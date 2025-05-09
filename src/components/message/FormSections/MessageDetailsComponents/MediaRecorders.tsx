
import { AudioRecorderDialog } from "@/components/media/AudioRecorderDialog";
import { VideoRecorderDialog } from "@/components/media/VideoRecorderDialog";
import { useAudioRecordingHandler } from "@/hooks/useAudioRecordingHandler";
import { useVideoRecordingHandler } from "@/hooks/useVideoRecordingHandler";
import { useMessageForm } from "../../MessageFormContext";

interface MediaRecordersProps {
  onAudioContentUpdate: (audioBlob: Blob, audioBase64: string) => Promise<void>;
  onVideoContentUpdate: (videoBlob: Blob, videoBase64: string) => Promise<void>;
}

export function MediaRecorders({ onAudioContentUpdate, onVideoContentUpdate }: MediaRecordersProps) {
  const {
    showAudioRecorder, setShowAudioRecorder,
  } = useAudioRecordingHandler();
  
  const {
    showVideoRecorder, setShowVideoRecorder,
  } = useVideoRecordingHandler();

  return (
    <>
      {/* Audio Recorder Dialog */}
      <AudioRecorderDialog 
        open={showAudioRecorder} 
        onOpenChange={setShowAudioRecorder} 
        onAudioReady={onAudioContentUpdate}
      />
      
      {/* Video Recorder Dialog */}
      <VideoRecorderDialog 
        open={showVideoRecorder} 
        onOpenChange={setShowVideoRecorder} 
        onVideoReady={onVideoContentUpdate}
      />
    </>
  );
}
