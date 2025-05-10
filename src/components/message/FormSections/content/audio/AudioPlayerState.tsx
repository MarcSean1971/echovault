
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Trash2, Clock, Volume2 } from "lucide-react";
import { formatDuration } from '@/utils/timeUtils';
import { cn } from "@/lib/utils";
import { toast } from '@/components/ui/use-toast';

export interface AudioPlayerStateProps {
  audioUrl: string;
  audioDuration: number;
  onClearAudio: () => void;
  inDialog?: boolean;
}

export function AudioPlayerState({
  audioUrl,
  audioDuration,
  onClearAudio,
  inDialog = false
}: AudioPlayerStateProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    // Add event listeners
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleAudioEnd);
    
    // Clean up
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleAudioEnd);
    };
  }, [audioUrl]);

  // Update progress bar as audio plays
  const updateProgress = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
      
      // Update progress bar width
      if (progressRef.current) {
        const width = (audio.currentTime / audio.duration) * 100;
        progressRef.current.style.width = `${width}%`;
      }
    }
  };
  
  // Handle audio ending
  const handleAudioEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (progressRef.current) {
      progressRef.current.style.width = '0%';
    }
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Audio started playing
          })
          .catch(error => {
            console.error("Error playing audio:", error);
            toast({
              title: "Playback Error",
              description: "There was a problem playing the audio. Please try again.",
              variant: "destructive"
            });
          });
      }
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle click on progress bar to seek
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = e.currentTarget;
    
    if (audio && progressBar) {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentClicked = clickX / rect.width;
      
      audio.currentTime = percentClicked * audio.duration;
      updateProgress();
    }
  };
  
  // Handle clearing the audio
  const handleClearAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    onClearAudio();
  };
  
  return (
    <div className={cn(
      "p-4 bg-muted/30 rounded-md border",
      inDialog ? "max-w-md mx-auto" : "w-full"
    )}>
      <div className="flex items-center mb-2">
        <Volume2 className="h-5 w-5 text-primary mr-2" />
        <span className="font-medium">Audio Recording</span>
      </div>
      
      <div className="mt-2">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={togglePlayPause}
            className="h-8 w-8 p-0 flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <div 
            className="relative h-2 bg-muted-foreground/20 rounded-full flex-grow cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              ref={progressRef}
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
              style={{ width: '0%' }}
            />
          </div>
          
          <span className="text-sm text-muted-foreground min-w-[60px] text-right">
            {formatDuration(currentTime)} / {formatDuration(audioDuration)}
          </span>
          
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleClearAudio}
            className="h-8 w-8 p-0"
          >
            {inDialog ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
