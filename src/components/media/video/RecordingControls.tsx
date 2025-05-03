
import React from "react";
import { Button } from "@/components/ui/button";
import { Video, Play, Pause, Square } from "lucide-react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function RecordingControls({
  isRecording,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop
}: RecordingControlsProps) {
  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        {isPaused ? (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onResume}
            className={`text-primary ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline} hover:scale-105`}
          >
            <Play className="w-4 h-4 mr-1 hover:scale-110 transition-all duration-200" /> Resume
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onPause}
            className={`text-muted-foreground ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline} hover:scale-105`}
          >
            <Pause className="w-4 h-4 mr-1 hover:scale-110 transition-all duration-200" /> Pause
          </Button>
        )}
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={onStop}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} hover:scale-105`}
        >
          <Square className="w-4 h-4 mr-1 hover:scale-110 transition-all duration-200" /> Stop
        </Button>
      </div>
    );
  }
  
  return (
    <Button 
      onClick={onStart}
      className={`bg-primary ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} hover:scale-105`}
    >
      <Video className="w-4 h-4 mr-1 hover:scale-110 transition-all duration-200" /> Start Recording
    </Button>
  );
}
