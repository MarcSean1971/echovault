
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2 } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  onClearVideo: () => void;
  hideDeleteButton?: boolean;
}

export function VideoPlayerControls({
  isPlaying,
  togglePlayback,
  onClearVideo,
  hideDeleteButton = false
}: VideoPlayerControlsProps) {
  // Handle play button click with a stopPropagation to prevent event bubbling
  const handlePlayPauseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    console.log("Play/Pause button clicked");
    togglePlayback();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              type="button"
              onClick={handlePlayPauseClick}
              className={`text-white hover:bg-white/20 ${HOVER_TRANSITION}`}
              aria-label={isPlaying ? "Pause video" : "Play video"}
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
      
      {/* Only show delete button if not hidden */}
      {!hideDeleteButton && (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    onClearVideo();
                  }}
                  className={`text-white hover:bg-white/20 ${HOVER_TRANSITION}`}
                  aria-label="Delete video"
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
      )}
    </div>
  );
}
