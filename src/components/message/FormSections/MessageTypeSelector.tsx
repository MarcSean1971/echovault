
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useMessageForm } from "../MessageFormContext";

interface MessageTypeSelectorProps {
  onTextTypeClick: () => void;
  onVideoTypeClick: () => void;
}

export function MessageTypeSelector({ onTextTypeClick, onVideoTypeClick }: MessageTypeSelectorProps) {
  const { messageType } = useMessageForm();
  
  return (
    <div className="space-y-2">
      <Label>Message Type</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={messageType === "text" ? "default" : "outline"}
          onClick={onTextTypeClick}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
        >
          Text
        </Button>
        <Button
          type="button"
          variant={messageType === "video" ? "default" : "outline"}
          onClick={onVideoTypeClick}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
        >
          Video
        </Button>
      </div>
    </div>
  );
}
