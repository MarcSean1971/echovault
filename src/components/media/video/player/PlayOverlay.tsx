
import React from "react";
import { Play } from "lucide-react";

interface PlayOverlayProps {
  isPlaying: boolean;
  onClick: () => void;
}

export function PlayOverlay({ isPlaying, onClick }: PlayOverlayProps) {
  if (isPlaying) return null;
  
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-background/30 rounded-full p-4 backdrop-blur-sm">
        <Play className="h-10 w-10 text-white" />
      </div>
    </div>
  );
}
