
import React, { useState, useRef, useEffect } from "react";
import { Message } from "@/types/message";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import { formatTime } from "@/utils/formatters";
import { Card } from "@/components/ui/card";

interface AudioMessageContentProps {
  message: Message;
}

export function AudioMessageContent({ message }: AudioMessageContentProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();
  
  // Extract audio data from message content
  useEffect(() => {
    if (!message.content) return;
    
    try {
      const contentObj = JSON.parse(message.content);
      
      if (contentObj.audioData) {
        // Convert base64 to blob and create URL
        const binaryString = window.atob(contentObj.audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        setAudioUrl(url);
        
        // Check for transcription
        if (contentObj.transcription) {
          setTranscription(contentObj.transcription);
        }
      }
    } catch (e) {
      console.error("Error parsing audio content:", e);
    }
    
    // Cleanup function
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [message.content]);
  
  // Update audio duration when it's loaded
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  // Function to handle the animation of the progress
  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };
  
  // Play/pause the audio
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current!);
    } else {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle the end of audio playback
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    cancelAnimationFrame(animationRef.current!);
  };
  
  if (!audioUrl) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-primary/10 hover:scale-105 transition-all"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          
          <div className="w-full space-y-1">
            <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Transcription */}
      {transcription && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Transcription</h3>
          <div className="bg-muted/20 p-3 rounded-md">
            <p>{transcription}</p>
          </div>
        </div>
      )}
    </div>
  );
}
