
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

interface AudioContentProps {
  audioUrl: string | null;
  onRecordClick: () => void;
  onClearAudio: () => void;
}

export function AudioContent({ audioUrl, onRecordClick, onClearAudio }: AudioContentProps) {
  if (audioUrl) {
    return (
      <div className="space-y-3">
        <AudioPlayer src={audioUrl} />
        <div className="flex justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onRecordClick}
            className={`mr-2 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
          >
            Record New
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={onClearAudio}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
          >
            Clear Audio
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-[150px] border-2 border-dashed rounded-md border-gray-300 bg-gray-50 p-6">
      <Button 
        onClick={onRecordClick}
        className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
      >
        Record Audio Message
      </Button>
    </div>
  );
}
