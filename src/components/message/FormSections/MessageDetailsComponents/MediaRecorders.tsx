
import { VideoContent } from "../content/VideoContent";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect } from "react";

interface MediaRecordersProps {
  showVideoRecorder: boolean;
  setShowVideoRecorder: (show: boolean) => void;
  onVideoContentUpdate: (videoBlob: Blob, skipTranscriptionOrBase64: boolean | string) => Promise<any>;
  videoUrl: string | null;
  videoBlob: Blob | null;
  isRecording?: boolean;
  isInitializing?: boolean;
  hasPermission?: boolean | null;
  previewStream?: MediaStream | null;
  startRecording?: () => Promise<void>; // Changed to only accept Promise<void>
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
  isInitializing = false,
  hasPermission = null,
  previewStream = null,
  startRecording = async () => {}, // Default implementation returns void
  stopRecording = () => {},
  clearVideo = () => {}
}: MediaRecordersProps) {
  // Log state changes for debugging
  useEffect(() => {
    console.log("MediaRecorders: Dialog open state =", showVideoRecorder);
  }, [showVideoRecorder]);
  
  return (
    <Dialog open={showVideoRecorder} onOpenChange={setShowVideoRecorder}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Video Message</DialogTitle>
          <DialogDescription>
            Record a video to include in your message
          </DialogDescription>
        </DialogHeader>
        
        <VideoContent
          videoUrl={videoUrl}
          isRecording={isRecording}
          isInitializing={isInitializing}
          hasPermission={hasPermission}
          previewStream={previewStream}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onClearVideo={clearVideo}
          inDialog={true}
        />
      </DialogContent>
    </Dialog>
  );
}

// Helper function to convert blob to base64 (can be used if needed)
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
