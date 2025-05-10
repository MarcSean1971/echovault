
import { useState, useEffect, useRef } from "react";
import { VideoPlayerControls } from "./VideoPlayerControls";

interface VideoPlayerProps {
  videoUrl: string | null;
  onClearVideo: () => void;
  inDialog?: boolean;
}

export function VideoPlayer({ videoUrl, onClearVideo, inDialog = false }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  // Handle play/pause toggle
  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // Try to play and handle any errors
      try {
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Video play error:", error);
            setIsPlaying(false);
          });
        }
      } catch (error) {
        console.error("Error playing video:", error);
        setIsPlaying(false);
      }
    }
  };
  
  // Update isPlaying state when video events occur
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error("Video error event:", e);
      setVideoError("Error playing video. Please try reloading the page.");
      setIsPlaying(false);
    };
    
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);
    
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
    };
  }, []);
  
  // Effect to handle videoUrl changes
  useEffect(() => {
    console.log("VideoPlayer: videoUrl changed:", 
                videoUrl ? videoUrl.substring(0, 30) + "..." : "null");
    
    // Reset video error when URL changes
    setVideoError(null);
    
    // Reset playing state when URL changes
    setIsPlaying(false);
    
    // If we have a video element and a URL, load it
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
    }
  }, [videoUrl]);
  
  // Show controls on hover with improved transition
  const showControls = () => setIsControlsVisible(true);
  const hideControls = () => setIsControlsVisible(false);
  
  // If there's no videoUrl, show a message
  if (!videoUrl) {
    return (
      <div className={`rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center ${
        inDialog ? 'w-full h-64 md:h-80' : 'w-full h-72 md:max-h-[450px]'
      }`}>
        <p className="text-muted-foreground text-center p-4">
          No video available. Try recording a new video.
        </p>
      </div>
    );
  }
  
  return (
    <div 
      className={`relative rounded-lg overflow-hidden group cursor-pointer ${
        inDialog ? 'w-full h-64 md:h-80' : 'w-full h-72 md:max-h-[450px]'
      }`}
      onClick={togglePlayback}
      onMouseEnter={showControls}
      onMouseLeave={hideControls}
      onTouchStart={showControls}
      onTouchEnd={() => setTimeout(hideControls, 3000)}
    >
      {videoError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center">
          <p>{videoError}</p>
        </div>
      ) : null}
      
      <video 
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain bg-black"
        playsInline
        onError={(e) => {
          console.error("Video error:", e);
          setVideoError("Error loading video. Please try reloading the page.");
        }}
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
