
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2 } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              type="button"
              onClick={togglePlayback}
              className={`text-white hover:bg-white/20 ${HOVER_TRANSITION}`}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPlaying ? 'Pause video' : 'Play video'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={onClearVideo}
                className={`text-white hover:bg-white/20 ${HOVER_TRANSITION}`}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete video</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
