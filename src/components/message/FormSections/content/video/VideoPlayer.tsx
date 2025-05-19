
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
      videoUrl: videoUrl ? "present" : "none",
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
  
  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
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
  
  return (
    <div className="space-y-2">
      <div className="relative rounded-md overflow-hidden bg-black group aspect-video w-full">
        <video 
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onEnded={() => setIsPlaying(false)}
          key={videoUrl} // Key helps React recognize when to remount the video element
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
