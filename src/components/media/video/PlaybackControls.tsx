import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
import { formatTime } from "@/utils/mediaUtils";

interface PlaybackControlsProps {
  isPlaying: boolean;
  recordingDuration: number;
  onTogglePlayback: () => void;
  onReset: () => void;
  onAccept: () => Promise<void>;
}

export function PlaybackControls({
  isPlaying,
  recordingDuration,
  onTogglePlayback,
  onReset,
  onAccept
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onTogglePlayback}
        className="hover:bg-muted/50 transition-colors duration-200"
      >
        {isPlaying ? (
          <>
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Play ({formatTime(recordingDuration)})
          </>
        )}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onReset}
        className="hover:bg-muted/50 transition-colors duration-200"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>
      <Button
        size="sm"
        onClick={onAccept}
        className="hover:bg-primary/90 text-white shadow-sm transition-colors duration-200"
      >
        <Check className="mr-2 h-4 w-4" />
        Accept
      </Button>
    </div>
  );
}
