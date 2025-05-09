
import { useRef, useState, useEffect } from "react";
import { VideoPlayerControls } from "./VideoPlayerControls";
import { VideoTranscription } from "./VideoTranscription";

interface VideoPlayerProps {
  videoUrl: string;
  transcription?: string | null;
  onTranscribe: () => Promise<void>;
  isTranscribing: boolean;
  onClearVideo: () => void;
}

export function VideoPlayer({
  videoUrl,
  transcription = null,
  onTranscribe,
  isTranscribing,
  onClearVideo
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
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
      <div className="relative rounded-md overflow-hidden bg-black">
        <video 
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full max-h-[300px]"
          onEnded={() => setIsPlaying(false)}
        />
        
        <VideoPlayerControls
          isPlaying={isPlaying}
          togglePlayback={togglePlayback}
          handleTranscribe={onTranscribe}
          isTranscribing={isTranscribing}
          onClearVideo={onClearVideo}
        />
      </div>
      
      <VideoTranscription 
        transcription={transcription} 
        isTranscribing={isTranscribing} 
      />
    </div>
  );
}
