
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
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Log when props change for debugging
  useEffect(() => {
    console.log("VideoPlayer: Props updated:", { 
      videoUrl: videoUrl ? "present" : "none",
      transcription: transcription ? transcription.substring(0, 30) + "..." : "none",
      isTranscribing
    });
  }, [videoUrl, transcription, isTranscribing]);
  
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
  
  // Handle transcription with error handling
  const handleTranscribe = async () => {
    setTranscriptionError(null);
    try {
      await onTranscribe();
    } catch (error: any) {
      console.error("Transcription error in VideoPlayer:", error);
      setTranscriptionError(error.message || "Failed to transcribe video");
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="relative rounded-md overflow-hidden bg-black group">
        <video 
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full max-h-[300px]"
          onEnded={() => setIsPlaying(false)}
          key={videoUrl} // Key helps React recognize when to remount the video element
        />
        
        <VideoPlayerControls
          isPlaying={isPlaying}
          togglePlayback={togglePlayback}
          handleTranscribe={handleTranscribe}
          isTranscribing={isTranscribing}
          onClearVideo={onClearVideo}
        />
      </div>
      
      <VideoTranscription 
        transcription={transcription} 
        isTranscribing={isTranscribing} 
        error={transcriptionError}
      />
    </div>
  );
}
