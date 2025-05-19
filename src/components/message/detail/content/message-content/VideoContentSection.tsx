
import React, { useState, useCallback } from "react";
import { Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";

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
  const [showVideo, setShowVideo] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Use the text_content directly if available, otherwise use additionalText from the hook
  const displayText = message.text_content || additionalText;
  
  // Function to trigger video loading only when user chooses to
  const handleLoadVideo = () => {
    setLoadingError(null);
    setShowVideo(true);
  };

  // Function to retry video loading if there was an error
  const handleRetry = () => {
    setLoadingError(null);
    setShowVideo(false);
    setTimeout(() => setShowVideo(true), 100); // Small delay before retry
  };
  
  return (
    <>
      {/* Video placeholder or loaded video */}
      <div className="mb-6 relative rounded-md overflow-hidden bg-black/5 hover:shadow-md">
        {!showVideo ? (
          // Show placeholder until user clicks to load
          <div className="aspect-video bg-muted/30 flex items-center justify-center">
            <Button 
              variant="outline" 
              className={`flex items-center gap-2 ${HOVER_TRANSITION}`}
              onClick={handleLoadVideo}
            >
              <Play className="h-4 w-4" /> Load Video
            </Button>
          </div>
        ) : (
          // Lazy-load the actual video component only when needed
          <div className="aspect-video">
            <VideoPlayer 
              message={message} 
              onError={(error) => setLoadingError(error)} 
            />
          </div>
        )}

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

// Simplified video player component with better loading states
function VideoPlayer({ message, onError }: { message: Message; onError: (error: string) => void }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [processingTimedOut, setProcessingTimedOut] = useState(false);
  
  // Setup a timer to increment progress artificially for user feedback
  React.useEffect(() => {
    if (!isLoading) return;
    
    let progressTimer: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;
    
    // Update progress every 300ms to simulate loading
    progressTimer = setInterval(() => {
      setLoadProgress(prev => {
        // Slow down progress as it gets higher
        const increment = prev < 30 ? 5 : prev < 70 ? 2 : 1;
        return Math.min(prev + increment, 95);
      });
    }, 300);
    
    // Set a timeout for 15 seconds to prevent endless spinning
    timeoutTimer = setTimeout(() => {
      setProcessingTimedOut(true);
      clearInterval(progressTimer);
    }, 15000);
    
    // Process video content
    processVideoContent();
    
    return () => {
      clearInterval(progressTimer);
      clearTimeout(timeoutTimer);
    };
  }, [message]);
  
  // Extract video data from message
  const processVideoContent = useCallback(async () => {
    try {
      // Reset states
      setIsLoading(true);
      setLoadProgress(10);
      
      // Import dynamically to avoid slowing down initial page load
      const { parseVideoContent } = await import('@/services/messages/mediaService');
      
      // Get video content
      const contentToUse = message.video_content || message.content;
      
      if (!contentToUse) {
        onError("No video content found");
        setIsLoading(false);
        return;
      }
      
      setLoadProgress(30);
      
      try {
        // Extract video data
        const { videoData } = parseVideoContent(contentToUse);
        
        if (!videoData) {
          onError("Unable to parse video content");
          setIsLoading(false);
          return;
        }
        
        setLoadProgress(60);
        
        // Create blob URL from video data
        const binaryString = window.atob(videoData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        setLoadProgress(80);
        
        const blob = new Blob([bytes], { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        setVideoUrl(url);
        setLoadProgress(100);
        setIsLoading(false);
      } catch (e) {
        console.error("Error processing video:", e);
        onError("Error processing video data");
        setIsLoading(false);
      }
    } catch (e) {
      console.error("Error in video processing:", e);
      onError("Error loading video processing module");
      setIsLoading(false);
    }
  }, [message, onError]);
  
  if (processingTimedOut) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 text-center p-4">
        <div>
          <p className="mb-2 text-muted-foreground">Video processing is taking longer than expected</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setProcessingTimedOut(false);
              setIsLoading(true);
              setLoadProgress(0);
              processVideoContent();
            }}
            className={HOVER_TRANSITION}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 p-8">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Loading video...</span>
            <span className="text-sm text-muted-foreground">{loadProgress}%</span>
          </div>
          <Progress 
            value={loadProgress} 
            className="h-2 w-full" 
            indicatorClassName={loadProgress >= 95 ? "bg-green-500" : ""} 
          />
          <div className="flex justify-center">
            <Spinner size="sm" className="border-blue-500" />
          </div>
        </div>
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
      className="w-full h-full"
      preload="metadata"
      onError={() => onError("Error playing video")}
    />
  );
}
