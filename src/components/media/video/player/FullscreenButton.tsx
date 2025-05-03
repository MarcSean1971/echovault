
import React from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onClick: () => void;
}

export function FullscreenButton({ isFullscreen, onClick }: FullscreenButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-white hover:bg-white/20"
      onClick={onClick}
    >
      {isFullscreen ? (
        <Minimize2 className="h-4 w-4" />
      ) : (
        <Maximize2 className="h-4 w-4" />
      )}
    </Button>
  );
}
