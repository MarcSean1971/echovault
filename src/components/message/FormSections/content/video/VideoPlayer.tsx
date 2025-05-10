
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
  
  // Handle play/pause toggle
  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Update isPlaying state when video events occur
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  // Show controls on hover with improved transition
  const showControls = () => setIsControlsVisible(true);
  const hideControls = () => setIsControlsVisible(false);
  
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
      {videoUrl && (
        <video 
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain bg-black"
          playsInline
        />
      )}
      
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
