
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AudioRecorder } from "./AudioRecorder";
import { AudioPlayer } from "./AudioPlayer";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

interface AudioRecorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAudioReady: (audioBlob: Blob, audioBase64: string) => Promise<any> | void;
  existingAudioUrl?: string | null;
  existingAudioBlob?: Blob | null;
}

export function AudioRecorderDialog({ 
  open, 
  onOpenChange, 
  onAudioReady,
  existingAudioUrl,
  existingAudioBlob
}: AudioRecorderDialogProps) {
  const [showRecorder, setShowRecorder] = useState(!existingAudioUrl);
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      console.log("AudioRecorderDialog opened, existing audio URL:", existingAudioUrl);
      console.log("Has existing audio blob:", !!existingAudioBlob);
      setShowRecorder(!existingAudioUrl);
    }
  }, [open, existingAudioUrl, existingAudioBlob]);
  
  const handleCancel = () => {
    onOpenChange(false);
    // Reset to show existing audio if available
    if (existingAudioUrl) {
      setShowRecorder(false);
    }
  };
  
  const handleAudioReady = async (audioBlob: Blob, audioBase64: string) => {
    console.log("AudioRecorderDialog: Audio ready, blob size:", audioBlob.size);
    try {
      await onAudioReady(audioBlob, audioBase64);
      onOpenChange(false);
    } catch (error) {
      console.error("Error handling audio in dialog:", error);
    }
  };
  
  const handleRecordNew = () => {
    setShowRecorder(true);
  };
  
  const handleKeepExisting = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Message</DialogTitle>
        </DialogHeader>
        
        {existingAudioUrl && !showRecorder ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm mb-2">You already have a recorded audio message:</p>
              <AudioPlayer src={existingAudioUrl} />
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
          <AudioRecorder 
            onAudioReady={handleAudioReady} 
            onCancel={handleCancel} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
