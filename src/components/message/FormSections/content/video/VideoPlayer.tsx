
import { useRef, useState, useEffect } from "react";
import { VideoPlayerControls } from "./VideoPlayerControls";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  onClearVideo: () => void;
}

export function VideoPlayer({
  videoUrl,
  onClearVideo
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    
    // When video URL changes, reset playback state and error state
    setIsPlaying(false);
    setLoadError(null);
    
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
        setLoadError(`Error playing video: ${err.message}`);
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle ending playback
  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      const handleEnded = () => setIsPlaying(false);
      const handleError = (e: Event) => {
        const videoElement = e.target as HTMLVideoElement;
        console.error("Video error:", videoElement.error);
        setLoadError(`Video loading error: ${videoElement.error?.message || 'Unknown error'}`);
      };
      
      video.addEventListener("ended", handleEnded);
      video.addEventListener("error", handleError);
      
      return () => {
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
      };
    }
  }, [videoRef]);
  
  // Prevent navigation or bubbling from video element itself
  const preventNavigation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // If we have a load error, show an error message
  if (loadError) {
    return (
      <div className="space-y-2" onClick={preventNavigation}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {loadError}. Try re-recording the video.
          </AlertDescription>
        </Alert>
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearVideo();
            }}
            className="hover:bg-destructive/90 hover:text-destructive-foreground transition-colors duration-200 hover:scale-105"
          >
            Clear Video
          </Button>
        </div>
      </div>
    );
  }
  
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

// Import Button for the error state
import { Button } from "@/components/ui/button";
