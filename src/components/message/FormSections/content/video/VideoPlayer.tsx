
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
  const [videoLoaded, setVideoLoaded] = useState(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  
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
    
    const handlePlay = () => {
      console.log("Video play event fired");
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      console.log("Video pause event fired");
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      console.log("Video ended event fired");
      setIsPlaying(false);
    };
    
    const handleError = (e: Event) => {
      console.error("Video error event:", e);
      setVideoError("Error playing video. Please try reloading the page.");
      setIsPlaying(false);
      setVideoLoaded(false); // Mark as not loaded on error
    };
    
    const handleLoadedData = () => {
      console.log("Video loaded data successfully");
      setVideoLoaded(true);
      setVideoError(null);
      
      // Clear any pending timeout
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
    
    const handleLoadedMetadata = () => {
      console.log("Video metadata loaded");
    };
    
    const handleCanPlay = () => {
      console.log("Video can play event fired");
      setVideoLoaded(true);
      setVideoError(null);
    };
    
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('loadeddata', handleLoadedData);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('canplay', handleCanPlay);
    
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('loadeddata', handleLoadedData);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('canplay', handleCanPlay);
    };
  }, []);
  
  // Log when videoUrl changes to help debug
  useEffect(() => {
    console.log("VideoPlayer: videoUrl changed:", 
                videoUrl ? videoUrl.substring(0, 30) + "..." : "null");
    
    // Store the current URL for recovery attempts
    videoUrlRef.current = videoUrl;
    
    // Reset video error when URL changes
    setVideoError(null);
    setVideoLoaded(false);
    
    // Reset playing state when URL changes
    setIsPlaying(false);
    
    // If we have a video element and a URL, manually trigger a load
    if (videoRef.current && videoUrl) {
      try {
        // Set the src directly first
        videoRef.current.src = videoUrl;
        
        // Force a reload
        videoRef.current.load();
        console.log("Forced video element to reload with new URL");
        
        // Set a safety timeout that will hide the loading indicator after 5 seconds
        // even if the video doesn't load properly
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
        
        loadTimeoutRef.current = setTimeout(() => {
          console.log("Safety timeout triggered - assuming video is loaded after 5 seconds");
          setVideoLoaded(true);
        }, 5000);
      } catch (err) {
        console.error("Error loading video:", err);
        setVideoError(`Failed to load video: ${err}`);
      }
    }
    
    // Clean up timeout on unmount or URL change
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [videoUrl]);
  
  // Show controls on hover with improved transition
  const showControls = () => setIsControlsVisible(true);
  const hideControls = () => setIsControlsVisible(false);
  
  // Verify we actually have a video URL to show
  useEffect(() => {
    if (!videoUrl) {
      console.warn("VideoPlayer rendered without a videoUrl");
    } else {
      console.log("VideoPlayer has URL:", videoUrl.substring(0, 30) + "...");
    }
  }, [videoUrl]);
  
  // Attempt recovery if video fails to load in normal way
  useEffect(() => {
    if (!videoLoaded && videoUrl && videoRef.current) {
      // Start a recovery timer
      const timer = setTimeout(() => {
        if (!videoLoaded && videoRef.current && videoUrl) {
          console.log("Attempting video recovery after load timeout");
          try {
            // Try setting the src attribute directly
            videoRef.current.src = videoUrl;
            
            // Force a reload
            videoRef.current.load();
            
            // Give it a bit more time
            setTimeout(() => {
              console.log("Setting videoLoaded=true after recovery attempt");
              setVideoLoaded(true);
            }, 1000);
          } catch (err) {
            console.error("Video recovery attempt failed:", err);
          }
        }
      }, 2000); // Wait 2 seconds for normal loading before attempting recovery
      
      return () => clearTimeout(timer);
    }
  }, [videoLoaded, videoUrl]);
  
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
      
      {!videoLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
          <div className="animate-spin w-8 h-8 border-t-2 border-blue-500 rounded-full"></div>
          <span className="mt-2">Loading video...</span>
          <button 
            className="mt-4 px-3 py-1 bg-blue-500/70 hover:bg-blue-600 rounded text-sm"
            onClick={(e) => {
              e.stopPropagation();
              setVideoLoaded(true);
              console.log("Force-hiding loading indicator via button click");
            }}
          >
            Hide loading indicator
          </button>
        </div>
      )}
      
      <video 
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain bg-black"
        playsInline
        preload="auto"
        onError={(e) => {
          console.error("Video error:", e);
          setVideoError("Error loading video. Please try again.");
          setVideoLoaded(false);
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
