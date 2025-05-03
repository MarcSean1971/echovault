
import { VideoControls } from "./video/player/VideoControls";
import { PlayOverlay } from "./video/player/PlayOverlay";
import { useVideoPlayerState } from "./video/player/useVideoPlayerState";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ src, poster, className = "" }: VideoPlayerProps) {
  const {
    isPlaying,
    isFullscreen,
    duration,
    currentTime,
    showControls,
    videoRef,
    videoContainerRef,
    togglePlay,
    handleTimeChange,
    toggleFullscreen,
    handleMouseMove
  } = useVideoPlayerState();

  return (
    <div 
      ref={videoContainerRef}
      className={`relative rounded-md overflow-hidden bg-black ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && showControls && setTimeout(() => handleMouseMove(), 0)}
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
      <PlayOverlay isPlaying={isPlaying} onClick={togglePlay} />
      
      {/* Controls overlay (bottom) */}
      <VideoControls
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        currentTime={currentTime}
        duration={duration}
        showControls={showControls}
        onTimeChange={handleTimeChange}
        onPlayPause={togglePlay}
        onFullscreen={toggleFullscreen}
      />
    </div>
  );
}
