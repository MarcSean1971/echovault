
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2 } from "lucide-react";

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  onClearVideo: () => void;
}

export function VideoPlayerControls({
  isPlaying,
  togglePlayback,
  onClearVideo
}: VideoPlayerControlsProps) {
  return (
    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
      <div className="flex gap-2 items-center">
        <Button 
          onClick={togglePlayback} 
          variant="secondary" 
          size="icon"
          className="rounded-full hover:bg-primary/90 hover:text-primary-foreground transition-colors duration-200"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        
        <Button
          onClick={onClearVideo}
          variant="ghost"
          size="icon"
          className="hover:bg-destructive/90 hover:text-destructive-foreground transition-colors duration-200"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
