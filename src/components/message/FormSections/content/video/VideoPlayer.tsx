
import { useState, useEffect, useRef } from "react";
import { VideoPlayerControls } from "./VideoPlayerControls";

interface VideoPlayerProps {
  videoUrl: string | null;
  onClearVideo: () => void;
  inDialog?: boolean;
}

export function VideoPlayer({ videoUrl, onClearVideo, inDialog = false }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // When videoUrl changes, ensure we reset player state
  useEffect(() => {
    console.log("VideoPlayer: Video URL changed:", videoUrl ? videoUrl.substring(0, 30) + "..." : "null");
    
    // Reset states when URL changes
    setIsPlaying(false);
    setVideoLoaded(false);
    
    // Safety timeout to ensure loading indicator disappears
    const safetyTimeout = setTimeout(() => {
      console.log("VideoPlayer: Safety timeout triggered - forcing loaded state");
      setVideoLoaded(true);
    }, 3000);
    
    return () => clearTimeout(safetyTimeout);
  }, [videoUrl]);
  
  // Toggle video playback
  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error("Error playing video:", error);
      });
    }
  };
  
  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoaded = () => {
      console.log("VideoPlayer: Video loaded successfully");
      setVideoLoaded(true);
    };
    const handleError = (e: Event) => {
      console.error("VideoPlayer: Error loading video:", e);
      setVideoLoaded(true); // Show video element even with error
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('canplay', handleLoaded);
    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('error', handleError);
    };
  }, []);
  
  // Show controls on hover with improved transition
  const showControls = () => setIsControlsVisible(true);
  const hideControls = () => setIsControlsVisible(false);
  
  if (!videoUrl) {
    return (
      <div className="rounded-lg bg-muted/20 flex items-center justify-center h-60">
        <p className="text-muted-foreground">No video available</p>
      </div>
    );
  }
  
  return (
    <div 
      className={`relative rounded-lg overflow-hidden group cursor-pointer bg-black ${
        inDialog ? 'w-full h-64 md:h-80' : 'w-full h-60 md:h-72'
      }`}
      onClick={togglePlayback}
      onMouseEnter={showControls}
      onMouseLeave={hideControls}
      onTouchStart={showControls}
      onTouchEnd={() => setTimeout(hideControls, 3000)}
    >
      {!videoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin w-8 h-8 border-t-2 border-blue-500 rounded-full mb-2"></div>
            <span>Loading video...</span>
          </div>
        </div>
      )}
      
      <video 
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
      />
      
      <VideoPlayerControls 
        isPlaying={isPlaying} 
        togglePlayback={togglePlayback} 
        onClearVideo={onClearVideo}
        inDialog={inDialog}
        isVisible={isControlsVisible}
      />
    </div>
  );
}
