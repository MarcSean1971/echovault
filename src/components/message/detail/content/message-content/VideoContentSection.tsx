
import React, { useState } from "react";
import { Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

// Import the new components
import { VideoPlayer } from "./VideoPlayer";
import { VideoErrorDisplay } from "./VideoErrorDisplay";
import { VideoTextDisplay } from "./VideoTextDisplay";

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
  const [isLoading, setIsLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // Use the text_content directly if available, otherwise use additionalText from the hook
  const displayText = message.text_content || additionalText;
  
  // Function to retry video loading if there was an error
  const handleRetry = () => {
    setLoadingError(null);
    loadVideo();
  };
  
  // Function to handle video loading errors
  const handleError = (error: string) => {
    setLoadingError(error);
  };
  
  // Load video from message content
  const loadVideo = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setVideoUrl(null);
      
      // Import dynamically to avoid slowing down initial page load
      const { parseVideoContent } = await import('@/services/messages/mediaService');
      
      // Get video content
      const contentToUse = message.video_content || message.content;
      
      if (!contentToUse) {
        setLoadingError("No video content found");
        setIsLoading(false);
        return;
      }
      
      try {
        // Extract video data
        const { videoData } = parseVideoContent(contentToUse);
        
        if (!videoData) {
          setLoadingError("Unable to parse video content");
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
        setLoadingError("Error processing video data");
      }
    } catch (e) {
      console.error("Error in video processing:", e);
      setLoadingError("Error loading video processing module");
    } finally {
      setIsLoading(false);
    }
  }, [message]);
  
  // Load video when component mounts
  React.useEffect(() => {
    loadVideo();
    
    // Cleanup function to revoke object URL when component unmounts
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [loadVideo, message]);
  
  return (
    <>
      {/* Video container with proper sizing - ensures consistent width */}
      <div className="mb-6 relative rounded-md overflow-hidden bg-black/5 hover:shadow-md transition-shadow">
        {/* Fixed aspect ratio container for video */}
        <div className="aspect-video w-full">
          <VideoPlayer 
            videoUrl={videoUrl}
            onError={handleError}
            isLoading={isLoading}
          />

          {/* Error handling with retry button */}
          {loadingError && (
            <VideoErrorDisplay 
              error={loadingError}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>
      
      {/* Display text content components */}
      <VideoTextDisplay 
        transcription={transcription}
        displayText={displayText}
      />
    </>
  );
}
