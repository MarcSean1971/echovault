
import React from "react";
import { Slider } from "@/components/ui/slider";
import { PlaybackButton } from "./PlaybackButton";
import { FullscreenButton } from "./FullscreenButton";
import { TimeDisplay } from "./TimeDisplay";

interface VideoControlsProps {
  isPlaying: boolean;
  isFullscreen: boolean;
  currentTime: number;
  duration: number;
  showControls: boolean;
  onTimeChange: (value: number[]) => void;
  onPlayPause: () => void;
  onFullscreen: () => void;
}

export function VideoControls({ 
  isPlaying, 
  isFullscreen,
  currentTime,
  duration,
  showControls,
  onTimeChange,
  onPlayPause,
  onFullscreen
}: VideoControlsProps) {
  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center space-x-2 mb-1">
        <Slider
          value={[currentTime]}
          max={duration || 0}
          step={0.1}
          onValueChange={onTimeChange}
          className="w-full"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PlaybackButton 
            isPlaying={isPlaying} 
            onClick={onPlayPause}
          />
          
          <TimeDisplay 
            currentTime={currentTime} 
            duration={duration} 
          />
        </div>
        
        <FullscreenButton 
          isFullscreen={isFullscreen} 
          onClick={onFullscreen} 
        />
      </div>
    </div>
  );
}
