
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface PlaybackButtonProps {
  isPlaying: boolean;
  onClick: () => void;
}

export function PlaybackButton({ isPlaying, onClick }: PlaybackButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-white hover:bg-white/20"
      onClick={onClick}
    >
      {isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
    </Button>
  );
}
