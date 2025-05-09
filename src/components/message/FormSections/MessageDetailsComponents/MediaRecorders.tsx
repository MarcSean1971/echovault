
import { VideoContent } from "../content/VideoContent";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect } from "react";

interface MediaRecordersProps {
  showVideoRecorder: boolean;
  setShowVideoRecorder: (show: boolean) => void;
  onVideoContentUpdate: (videoBlob: Blob, videoBase64: string) => Promise<any>;
  videoUrl: string | null;
  videoBlob: Blob | null;
  isRecording?: boolean;
  startRecording?: () => Promise<void>;
  stopRecording?: () => void;
  clearVideo?: () => void;
}

export function MediaRecorders({ 
  showVideoRecorder, 
  setShowVideoRecorder,
  onVideoContentUpdate,
  videoUrl,
  videoBlob,
  isRecording = false,
  startRecording = async () => {},
  stopRecording = () => {},
  clearVideo = () => {}
}: MediaRecordersProps) {
  // Handle video transcription
  const handleTranscribeVideo = async () => {
    if (videoBlob) {
      const base64 = await blobToBase64(videoBlob);
      return onVideoContentUpdate(videoBlob, base64);
    }
    return Promise.resolve({});
  };
  
  // Log state changes for debugging
  useEffect(() => {
    console.log("MediaRecorders: showVideoRecorder state changed:", showVideoRecorder);
  }, [showVideoRecorder]);
  
  return (
    <Dialog open={showVideoRecorder} onOpenChange={setShowVideoRecorder}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Video Message</DialogTitle>
        </DialogHeader>
        
        <VideoContent
          videoUrl={videoUrl}
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onClearVideo={clearVideo}
          onTranscribeVideo={handleTranscribeVideo}
          inDialog={true}
        />
      </DialogContent>
    </Dialog>
  );
}

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
