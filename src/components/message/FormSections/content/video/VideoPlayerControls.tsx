
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, FileText } from "lucide-react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  handleTranscribe: () => void;
  isTranscribing: boolean;
  onClearVideo: () => void;
}

export function VideoPlayerControls({
  isPlaying,
  togglePlayback,
  handleTranscribe,
  isTranscribing,
  onClearVideo
}: VideoPlayerControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={togglePlayback}
        className={`text-white hover:bg-white/20 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.subtle}`}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTranscribe}
          disabled={isTranscribing}
          className={`text-white hover:bg-white/20 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.subtle}`}
        >
          <FileText className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearVideo}
          className={`text-white hover:bg-white/20 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.subtle}`}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
