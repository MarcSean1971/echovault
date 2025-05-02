
import React from "react";
import { Button } from "@/components/ui/button";
import { Video, Play, Pause, Square } from "lucide-react";

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
            className="text-primary"
          >
            <Play className="w-4 h-4 mr-1" /> Resume
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onPause}
            className="text-muted-foreground"
          >
            <Pause className="w-4 h-4 mr-1" /> Pause
          </Button>
        )}
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={onStop}
        >
          <Square className="w-4 h-4 mr-1" /> Stop
        </Button>
      </div>
    );
  }
  
  return (
    <Button 
      onClick={onStart}
      className="bg-primary"
    >
      <Video className="w-4 h-4 mr-1" /> Start Recording
    </Button>
  );
}
