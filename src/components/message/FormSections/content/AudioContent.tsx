
import React, { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Pause, Trash2 } from "lucide-react";
import { formatTime } from "@/utils/mediaUtils";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";

interface AudioContentProps {
  audioUrl: string | null;
  audioDuration?: number;
  isRecording: boolean;
  isInitializing: boolean;
  hasPermission: boolean | null;
  transcription?: string | null;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onClearAudio: () => void;
  onTranscribeAudio?: () => Promise<void>;
  inDialog?: boolean;
}

export function AudioContent({
  audioUrl,
  audioDuration = 0,
  isRecording,
  isInitializing,
  hasPermission,
  transcription,
  onStartRecording,
  onStopRecording,
  onClearAudio,
  onTranscribeAudio,
  inDialog = false
}: AudioContentProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();
  
  // Reset state when audio changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioError(null);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [audioUrl]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Cancel any animations
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Stop audio playback if playing
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  // Update audio duration when it's loaded
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  // Handle audio loading errors
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    console.error("Audio element error:", e);
    setAudioError("Could not load audio. The file may be corrupted or inaccessible.");
    setIsPlaying(false);
    
    toast({
      title: "Audio Playback Error",
      description: "Failed to play audio. Please try again.",
      variant: "destructive"
    });
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
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        cancelAnimationFrame(animationRef.current!);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // Playback started successfully
            animationRef.current = requestAnimationFrame(updateProgress);
          }).catch(error => {
            // Auto-play was prevented or other error
            console.error("Error playing audio:", error);
            setIsPlaying(false);
            toast({
              title: "Playback Error",
              description: "Could not play audio. Browser may be blocking autoplay.",
              variant: "destructive"
            });
          });
        }
      }
      
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Toggle playback error:", error);
      setIsPlaying(false);
      toast({
        title: "Playback Error",
        description: "An error occurred while controlling audio playback.",
        variant: "destructive"
      });
    }
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
  
  // Handle transcribing audio
  const handleTranscribe = async () => {
    if (onTranscribeAudio) {
      setIsTranscribing(true);
      try {
        await onTranscribeAudio();
      } catch (error) {
        console.error("Error during transcription:", error);
        toast({
          title: "Transcription Error",
          description: "Failed to transcribe audio. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsTranscribing(false);
      }
    }
  };
  
  // Handle starting recording with loading state and error handling
  const handleStartRecording = async () => {
    setIsStartingRecording(true);
    try {
      await onStartRecording();
    } catch (error) {
      console.error("Error starting recording from AudioContent:", error);
      // Toast notification is already handled in the hook
    } finally {
      setIsStartingRecording(false);
    }
  };
  
  // Render empty state when no audio
  if (!audioUrl && !isRecording) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center space-y-4 border-dashed border-2">
        <div className="text-center text-muted-foreground">
          {isInitializing ? (
            <div className="flex items-center justify-center space-x-2">
              <Spinner size="sm" />
              <p>Initializing microphone...</p>
            </div>
          ) : hasPermission === false ? (
            <p>Microphone access denied. Please check your browser permissions.</p>
          ) : (
            <>
              <p className="mb-2">Record an audio message</p>
              <Button 
                onClick={handleStartRecording}
                disabled={isInitializing || isStartingRecording}
                className="flex items-center space-x-2 hover:bg-primary/90 hover:scale-105 transition-all"
              >
                {isStartingRecording ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    <span>Start Recording</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </Card>
    );
  }
  
  // Render recording state
  if (isRecording) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-950/20">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-red-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-red-600 text-white p-4 rounded-full">
              <Mic className="h-6 w-6" />
            </div>
          </div>
          <p className="text-lg font-medium">Recording audio...</p>
          <p className="text-sm text-muted-foreground">{formatTime(audioDuration)}</p>
          
          <Button 
            onClick={onStopRecording}
            variant="destructive"
            className="hover:bg-destructive/90 hover:scale-105 transition-all"
          >
            <MicOff className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        </div>
      </Card>
    );
  }
  
  // Render audio player
  return (
    <div className="space-y-4">
      {/* Audio element (hidden) */}
      <audio 
        ref={audioRef} 
        src={audioUrl || undefined} 
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
      />
      
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Audio Message</h3>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onClearAudio}
              className="hover:bg-destructive/90 hover:scale-105 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete Audio</span>
            </Button>
          </div>
          
          {audioError ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md">
              <p>{audioError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={onClearAudio}
              >
                Clear and try again
              </Button>
            </div>
          ) : (
            <>
              {/* Audio player controls */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-primary/10 hover:scale-105 transition-all"
                  onClick={togglePlayback}
                  disabled={!audioUrl}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                
                <div className="w-full space-y-1">
                  <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration || audioDuration || 0)}</span>
                  </div>
                </div>
              </div>
              
              {/* Transcription */}
              {!inDialog && (
                <div className="mt-4">
                  {transcription ? (
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded text-sm">
                      <h4 className="text-xs uppercase text-muted-foreground mb-1">Transcription</h4>
                      <p>{transcription}</p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleTranscribe}
                      disabled={!onTranscribeAudio || isTranscribing}
                      className="w-full hover:bg-primary/10 hover:scale-105 transition-all"
                    >
                      {isTranscribing ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Transcribing...
                        </>
                      ) : (
                        "Transcribe Audio"
                      )}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
