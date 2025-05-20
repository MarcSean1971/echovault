
import React, { useState, useCallback } from "react";
import { Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VideoPlayerControls } from "@/components/message/FormSections/content/video/VideoPlayerControls";

interface VideoContentSectionProps {
  message: Message;
  additionalText: string | null;
  transcription: string | null;
}

export function VideoContentSection({ 
  message, 
  additionalText, 
  transcription 
}: VideoContentSectionProps) {
  // States for managing video loading and playback
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Use the text_content directly if available, otherwise use additionalText from the hook
  const displayText = message.text_content || additionalText;
  
  // Function to retry video loading if there was an error
  const handleRetry = () => {
    setLoadingError(null);
  };
  
  return (
    <>
      {/* Video container with proper sizing - ensures consistent width */}
      <div className="mb-6 relative rounded-md overflow-hidden bg-black/5 hover:shadow-md transition-shadow">
        {/* Fixed aspect ratio container for video */}
        <div className="aspect-video w-full">
          <VideoPlayer 
            message={message} 
            onError={(error) => setLoadingError(error)}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        </div>

        {/* Error handling with retry button */}
        {loadingError && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
            <p className="mb-3 text-center px-4">{loadingError}</p>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/20 text-white hover:bg-white/30"
              onClick={handleRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </div>
        )}
      </div>
      
      {/* Show transcription immediately if available - this is just text */}
      {transcription && (
        <div className="mt-6 mb-4">
          <h3 className="text-sm font-medium mb-2">Video Transcription</h3>
          <div className={`p-3 bg-muted/40 rounded-md ${HOVER_TRANSITION}`}>
            <p className="whitespace-pre-wrap">{transcription}</p>
          </div>
        </div>
      )}
      
      {/* Show additional text immediately if available - also just text */}
      {displayText && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Additional Notes</h3>
          <div className={`whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base ${HOVER_TRANSITION}`}>
            {displayText}
          </div>
        </div>
      )}
    </>
  );
}

// Optimized video player component with fixed play/pause functionality
function VideoPlayer({ 
  message, 
  onError, 
  isPlaying, 
  setIsPlaying 
}: { 
  message: Message; 
  onError: (error: string) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Process video content immediately when component mounts
  React.useEffect(() => {
    // Reset states and start loading immediately
    setIsLoading(true);
    setVideoUrl(null);
    
    // Use an async function to process video
    const loadVideo = async () => {
      try {
        // Import dynamically to avoid slowing down initial page load
        const { parseVideoContent } = await import('@/services/messages/mediaService');
        
        // Get video content
        const contentToUse = message.video_content || message.content;
        
        if (!contentToUse) {
          onError("No video content found");
          setIsLoading(false);
          return;
        }
        
        try {
          // Extract video data
          const { videoData } = parseVideoContent(contentToUse);
          
          if (!videoData) {
            onError("Unable to parse video content");
            setIsLoading(false);
            return;
          }
          
          // Create blob URL from video data
          const binaryString = window.atob(videoData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          
          // Log successful video URL creation for debugging
          console.log("Video loaded successfully:", url);
          setVideoUrl(url);
        } catch (e) {
          console.error("Error processing video:", e);
          onError("Error processing video data");
        }
      } catch (e) {
        console.error("Error in video processing:", e);
        onError("Error loading video processing module");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Start loading video immediately
    loadVideo();
    
    // Cleanup function to revoke object URL when component unmounts
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [message, onError]);
  
  // Handle video playback
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  // Toggle video playback - Fixed to ensure proper operation
  const togglePlayback = useCallback(() => {
    if (!videoRef.current) {
      console.error("Video element reference is null");
      return;
    }
    
    console.log("Toggle playback called, current state:", isPlaying);
    
    if (isPlaying) {
      console.log("Pausing video");
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      console.log("Playing video");
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
        onError("Error playing video: " + (err.message || "Unknown error"));
      });
      setIsPlaying(true);
    }
  }, [isPlaying, setIsPlaying, onError]);
  
  // Handle video ended event
  const handleVideoEnded = useCallback(() => {
    console.log("Video playback ended");
    setIsPlaying(false);
  }, [setIsPlaying]);
  
  // Handle video loaded event
  const handleVideoLoaded = useCallback(() => {
    console.log("Video loaded and ready to play");
  }, []);
  
  // Handle video error event
  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video error:", e);
    onError("Error loading video");
  }, [onError]);
  
  // Handle clearing the video
  const onClearVideo = useCallback(() => {
    // This is just a placeholder since we don't need this functionality in the display view
    console.log("Clear video requested but not implemented in display view");
  }, []);
  
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
      
      {/* Custom video controls using the standardized VideoPlayerControls component */}
      <VideoPlayerControls
        isPlaying={isPlaying}
        togglePlayback={togglePlayback}
        onClearVideo={onClearVideo}
      />
    </div>
  );
}
