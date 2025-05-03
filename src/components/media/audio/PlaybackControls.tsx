
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, Check } from "lucide-react";
import { formatDuration } from "@/utils/audioUtils";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

interface PlaybackControlsProps {
  isPlaying: boolean;
  recordingDuration: number;
  onTogglePlayback: () => void;
  onReset: () => void;
  onAccept: () => void;
}

export function PlaybackControls({
  isPlaying,
  recordingDuration,
  onTogglePlayback,
  onReset,
  onAccept
}: PlaybackControlsProps) {
  return (
    <>
      <div className="relative w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center mb-2">
        <Button
          variant="ghost"
          size="icon"
          className={`w-full h-full rounded-full ${HOVER_TRANSITION} hover:bg-primary/10`}
          onClick={onTogglePlayback}
        >
          {isPlaying ? (
            <Pause className="w-10 h-10 text-primary" />
          ) : (
            <Play className="w-10 h-10 text-primary" />
          )}
        </Button>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-lg font-medium">{formatDuration(recordingDuration)}</div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onReset}
          className={`text-destructive ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
        >
          <Trash2 className="w-4 h-4 mr-1" /> Discard
        </Button>
        <Button 
          size="sm"
          onClick={onAccept}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
        >
          <Check className="w-4 h-4 mr-1" /> Accept
        </Button>
      </div>
    </>
  );
}
