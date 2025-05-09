
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useMessageForm } from "../MessageFormContext";
import { FileText, Video, Mic } from "lucide-react";

interface MessageTypeSelectorProps {
  onTextTypeClick: () => void;
  onVideoTypeClick: () => void;
  onAudioTypeClick: () => void;
}

// This component is now deprecated and replaced by tabs in MessageDetails.tsx
// Kept for backward compatibility with other components that might still reference it
export function MessageTypeSelector({ 
  onTextTypeClick, 
  onVideoTypeClick,
  onAudioTypeClick 
}: MessageTypeSelectorProps) {
  const { messageType } = useMessageForm();
  
  return (
    <div className="space-y-2">
      <Label>Message Type</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={messageType === "text" ? "default" : "outline"}
          onClick={onTextTypeClick}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex gap-2 items-center`}
        >
          <FileText className="h-4 w-4" />
          Text
        </Button>
        
        <Button
          type="button"
          variant={messageType === "audio" ? "default" : "outline"}
          onClick={onAudioTypeClick}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex gap-2 items-center`}
        >
          <Mic className="h-4 w-4" />
          Audio
        </Button>
        
        <Button
          type="button"
          variant={messageType === "video" ? "default" : "outline"}
          onClick={onVideoTypeClick}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex gap-2 items-center`}
        >
          <Video className="h-4 w-4" />
          Video
        </Button>
      </div>
    </div>
  );
}
