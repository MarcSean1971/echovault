
import React, { useState } from "react";
import { Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

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
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  // Use the text_content directly if available, otherwise use additionalText from the hook
  const displayText = message.text_content || additionalText;
  
  // Function to trigger video loading only when user chooses to
  const handleLoadVideo = () => {
    setIsVideoLoading(true);
    setShowVideo(true);
  };
  
  return (
    <>
      {/* Video placeholder or loaded video */}
      <div className="mb-6 relative rounded-md overflow-hidden bg-black/5">
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
            <LazyVideoLoader message={message} />
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

// Separate component to handle video loading
function LazyVideoLoader({ message }: { message: Message }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  React.useEffect(() => {
    // Import dynamically to avoid slowing down initial page load
    import('@/services/messages/mediaService').then(module => {
      const { parseVideoContent } = module;
      
      // Get video content
      const contentToUse = message.video_content || message.content;
      
      if (!contentToUse) {
        setIsProcessing(false);
        setError("No video content found");
        return;
      }
      
      try {
        // Extract video data - moved to separate function to avoid blocking UI
        setTimeout(() => {
          try {
            const { videoData } = parseVideoContent(contentToUse);
            
            if (!videoData) {
              setIsProcessing(false);
              setError("Unable to parse video content");
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
            setIsProcessing(false);
          } catch (e) {
            console.error("Error processing video:", e);
            setError("Error processing video");
            setIsProcessing(false);
          }
        }, 500);
      } catch (e) {
        console.error("Error in video processing:", e);
        setError("Error processing video");
        setIsProcessing(false);
      }
    });
    
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [message, videoUrl]);
  
  if (isProcessing) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <div className="text-center p-4 text-muted-foreground">
          <p>{error}</p>
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
    />
  );
}
