
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleVideoRecorder } from "./SimpleVideoRecorder";

interface VideoRecorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoReady: (videoBlob: Blob, videoBase64: string) => void;
}

export function VideoRecorderDialog({ open, onOpenChange, onVideoReady }: VideoRecorderDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };
  
  const handleVideoReady = (videoBlob: Blob, videoBase64: string) => {
    onVideoReady(videoBlob, videoBase64);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Video Message</DialogTitle>
        </DialogHeader>
        <SimpleVideoRecorder 
          onVideoReady={handleVideoReady} 
          onCancel={handleCancel} 
        />
      </DialogContent>
    </Dialog>
  );
}
