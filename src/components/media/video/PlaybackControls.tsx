
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, Check } from "lucide-react";
import { formatDuration } from "@/utils/audioUtils";

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
    <div className="flex items-center justify-between w-full">
      <Button 
        variant="outline"
        size="sm"
        onClick={onTogglePlayback}
      >
        {isPlaying ? (
          <><Pause className="w-4 h-4 mr-1" /> Pause</>
        ) : (
          <><Play className="w-4 h-4 mr-1" /> Play</>
        )}
      </Button>
      
      <span className="text-sm font-medium">
        {formatDuration(recordingDuration)}
      </span>
      
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onReset}
          className="text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Discard
        </Button>
        <Button 
          size="sm"
          onClick={onAccept}
        >
          <Check className="w-4 h-4 mr-1" /> Accept
        </Button>
      </div>
    </div>
  );
}
