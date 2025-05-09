
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleVideoRecorder } from "./SimpleVideoRecorder";
import { VideoPlayer } from "./VideoPlayer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

interface VideoRecorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoReady: (videoBlob: Blob, videoBase64: string) => void;
  existingVideoUrl?: string | null;
  existingVideoBlob?: Blob | null;
}

export function VideoRecorderDialog({ 
  open, 
  onOpenChange, 
  onVideoReady,
  existingVideoUrl,
  existingVideoBlob
}: VideoRecorderDialogProps) {
  const [showRecorder, setShowRecorder] = useState(!existingVideoUrl);
  
  const handleCancel = () => {
    onOpenChange(false);
    setShowRecorder(!existingVideoUrl);
  };
  
  const handleVideoReady = (videoBlob: Blob, videoBase64: string) => {
    onVideoReady(videoBlob, videoBase64);
    onOpenChange(false);
    setShowRecorder(false);
  };
  
  const handleRecordNew = () => {
    setShowRecorder(true);
  };
  
  const handleKeepExisting = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Video Message</DialogTitle>
        </DialogHeader>
        
        {existingVideoUrl && !showRecorder ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm mb-2">You already have a recorded video message:</p>
              <VideoPlayer src={existingVideoUrl} className="w-full aspect-video" />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline" 
                onClick={handleRecordNew}
                className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
              >
                Record New
              </Button>
              <Button 
                onClick={handleKeepExisting}
                className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
              >
                Keep Existing
              </Button>
            </div>
          </div>
        ) : (
          <SimpleVideoRecorder 
            onVideoReady={handleVideoReady} 
            onCancel={handleCancel} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
