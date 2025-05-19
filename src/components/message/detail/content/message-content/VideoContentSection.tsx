
import React, { useState, useCallback } from "react";
import { Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
  // States for managing video loading
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Use the text_content directly if available, otherwise use additionalText from the hook
  const displayText = message.text_content || additionalText;
  
  // Function to retry video loading if there was an error
  const handleRetry = () => {
    setLoadingError(null);
  };
  
  return (
    <>
      {/* Video container with proper sizing - ensures consistent width */}
      <div className="mb-6 relative rounded-md overflow-hidden bg-black/5 hover:shadow-md">
        {/* Fixed aspect ratio container for video */}
        <div className="aspect-video w-full">
          <VideoPlayer 
            message={message} 
            onError={(error) => setLoadingError(error)} 
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

// Optimized video player component with proper width constraints
function VideoPlayer({ message, onError }: { message: Message; onError: (error: string) => void }) {
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
    <video 
      controls
      src={videoUrl}
      className="w-full h-full object-contain"
      preload="metadata"
      onError={() => onError("Error playing video")}
    />
  );
}
