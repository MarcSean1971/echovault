
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AudioRecorder } from "./AudioRecorder";

interface AudioRecorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAudioReady: (audioBlob: Blob, audioBase64: string) => void;
}

export function AudioRecorderDialog({ open, onOpenChange, onAudioReady }: AudioRecorderDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };
  
  const handleAudioReady = (audioBlob: Blob, audioBase64: string) => {
    onAudioReady(audioBlob, audioBase64);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Voice Message</DialogTitle>
        </DialogHeader>
        <AudioRecorder 
          onAudioReady={handleAudioReady} 
          onCancel={handleCancel} 
        />
      </DialogContent>
    </Dialog>
  );
}
