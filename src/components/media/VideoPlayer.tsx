
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Expand, Maximize2, Minimize2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ src, poster, className = "" }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const setVideoData = () => {
      setDuration(video.duration);
    };
    
    const setVideoTime = () => {
      setCurrentTime(video.currentTime);
    };
    
    // Events
    video.addEventListener('loadeddata', setVideoData);
    video.addEventListener('timeupdate', setVideoTime);
    video.addEventListener('ended', () => setIsPlaying(false));
    
    // Add fullscreen change event listener
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === videoContainerRef.current
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      video.removeEventListener('loadeddata', setVideoData);
      video.removeEventListener('timeupdate', setVideoTime);
      video.removeEventListener('ended', () => setIsPlaying(false));
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [src]);
  
  // Toggle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle time change on slider
  const handleTimeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    const videoContainer = videoContainerRef.current;
    if (!videoContainer) return;
    
    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // Show controls when mouse moves over video
  const handleMouseMove = () => {
    setShowControls(true);
    
    // Reset the timer
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    
    // Hide controls after 3 seconds of inactivity
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };
  
  // Format time in MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={videoContainerRef}
      className={`relative rounded-md overflow-hidden bg-black ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video element */}
      <video 
        ref={videoRef} 
        src={src} 
        poster={poster}
        className="w-full h-full" 
        onClick={togglePlay}
        playsInline
      />
      
      {/* Play/pause overlay button (center) */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="bg-background/30 rounded-full p-4 backdrop-blur-sm">
            <Play className="h-10 w-10 text-white" />
          </div>
        </div>
      )}
      
      {/* Controls overlay (bottom) */}
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
            onValueChange={handleTimeChange}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <div className="text-xs text-white opacity-90">
              <span>{formatTime(currentTime)}</span>
              <span> / </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
