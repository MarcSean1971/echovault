
import React from "react";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { Spinner } from "@/components/ui/spinner";
import { VideoPlayerControls } from "@/components/message/FormSections/content/video/VideoPlayerControls";

interface VideoPlayerProps {
  videoUrl: string | null;
  onError: (error: string) => void;
  isLoading: boolean;
}

export function VideoPlayer({ videoUrl, onError, isLoading }: VideoPlayerProps) {
  const {
    videoRef,
    isPlaying,
    togglePlayback,
    handleVideoEnded,
    handleVideoLoaded,
    handleVideoError
  } = useVideoPlayer({ videoUrl, onError });
  
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <Spinner size="md" className="text-primary" />
      </div>
    );
  }
  
  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Video unavailable</p>
      </div>
    );
  }
  
  // Placeholder for clearing video (not needed in display view)
  const onClearVideo = () => {
    console.log("Clear video requested but not implemented in display view");
  };
  
  return (
    <div className="relative group h-full w-full bg-black">
      <video 
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        preload="metadata"
        onLoadedData={handleVideoLoaded}
        onError={handleVideoError}
        onEnded={handleVideoEnded}
      />
      
      <VideoPlayerControls
        isPlaying={isPlaying}
        togglePlayback={togglePlayback}
        onClearVideo={onClearVideo}
      />
    </div>
  );
}
