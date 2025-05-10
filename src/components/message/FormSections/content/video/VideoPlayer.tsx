
import { useRef, useState, useEffect } from "react";
import { VideoPlayerControls } from "./VideoPlayerControls";

interface VideoPlayerProps {
  videoUrl: string;
  onClearVideo: () => void;
}

export function VideoPlayer({
  videoUrl,
  onClearVideo
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Log when props change for debugging
  useEffect(() => {
    console.log("VideoPlayer: Props updated:", { 
      videoUrl: videoUrl ? "present" : "none"
    });
  }, [videoUrl]);
  
  // Reset video when URL changes
  useEffect(() => {
    console.log("VideoPlayer: videoUrl changed:", videoUrl ? videoUrl.substring(0, 30) + "..." : "none");
    
    // When video URL changes, reset playback state
    setIsPlaying(false);
    
    // Ensure video element loads the new URL correctly
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);
  
  // Prevent navigation when toggling playback
  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // Use play() but handle promise rejection
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle ending playback
  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      const handleEnded = () => setIsPlaying(false);
      video.addEventListener("ended", handleEnded);
      
      return () => {
        video.removeEventListener("ended", handleEnded);
      };
    }
  }, [videoRef]);
  
  // Prevent navigation or bubbling from video element itself
  const preventNavigation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div className="space-y-2" onClick={preventNavigation}>
      <div className="relative rounded-md overflow-hidden bg-black group">
        <video 
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full max-h-[300px]"
          onEnded={() => setIsPlaying(false)}
          key={videoUrl} // Key helps React recognize when to remount the video element
          onClick={preventNavigation}
        />
        
        <VideoPlayerControls
          isPlaying={isPlaying}
          togglePlayback={togglePlayback}
          onClearVideo={onClearVideo}
        />
      </div>
    </div>
  );
}
