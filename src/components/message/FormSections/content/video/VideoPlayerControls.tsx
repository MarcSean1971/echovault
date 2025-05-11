
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, FileText } from "lucide-react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  handleTranscribe: () => void;
  isTranscribing: boolean;
  onClearVideo: () => void;
}

export function VideoPlayerControls({
  isPlaying,
  togglePlayback,
  handleTranscribe,
  isTranscribing,
  onClearVideo
}: VideoPlayerControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              type="button"
              onClick={togglePlayback}
              className={`text-white hover:bg-white/20 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.subtle}`}
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
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className={`text-white hover:bg-white/20 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.subtle}`}
              >
                <FileText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Transcribe video audio</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={onClearVideo}
                className={`text-white hover:bg-white/20 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.subtle}`}
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
