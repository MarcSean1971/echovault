
import React, { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseVideoContent } from "@/services/messages/mediaService";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function VideoContentSection({ message, additionalText, transcription }: { 
  message: Message; 
  additionalText: string | null;
  transcription: string | null;
}) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoIsReady, setVideoIsReady] = useState(false);
  const [posterCreated, setPosterCreated] = useState(false);
  
  // Parse the video content immediately and start progressive loading ASAP
  useEffect(() => {
    console.log("[VideoContentSection] Component mounted, starting progressive loading IMMEDIATELY");
    
    // First check video_content field, then fall back to content if needed
    const contentToUse = message.video_content || message.content;
    
    if (!contentToUse) {
      console.log("[VideoContentSection] No video content available");
      setError("No video content available");
      return;
    }
    
    try {
      // Parse video data from message content - this happens immediately
      console.log("[VideoContentSection] Parsing video content");
      const { videoData } = parseVideoContent(contentToUse);
      
      if (videoData) {
        try {
          // Create placeholder and poster immediately
          const createPosterAndVideo = async () => {
            try {
              // Process the whole video data at once - faster approach
              console.log("[VideoContentSection] Processing video data");
              const binaryString = window.atob(videoData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'video/webm' });
              const url = URL.createObjectURL(blob);
              
              // Create and set poster from the same data
              const canvas = document.createElement('canvas');
              canvas.width = 320;
              canvas.height = 240;
              canvas.getContext('2d')?.fillRect(0, 0, canvas.width, canvas.height);
              const posterUrl = canvas.toDataURL();
              
              // Update state with both URLs
              console.log("[VideoContentSection] Video and poster processed");
              setPosterUrl(posterUrl);
              setPosterCreated(true);
              setVideoUrl(url);
              setVideoIsReady(true);
            } catch (e) {
              console.error("[VideoContentSection] Error processing video:", e);
              setError("Error processing video data");
            }
          };
          
          // Start processing immediately
          createPosterAndVideo();
        } catch (e) {
          console.error("[VideoContentSection] Error processing video data:", e);
          setError("Error processing video data");
        }
      } else {
        console.log("[VideoContentSection] No video data found in message content");
        setError("Video data not available");
      }
      
    } catch (e) {
      console.error("[VideoContentSection] Error parsing video content:", e);
      setError("Error parsing video content");
    }
    
    // Clean up URLs on unmount
    return () => {
      console.log("[VideoContentSection] Component unmounting, cleaning up resources");
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [message.video_content, message.content]);
  
  // Render error state - only if we have nothing else to show
  if (error && !videoUrl && !posterUrl) {
    return (
      <div className="p-4 bg-muted/40 rounded-md text-center text-muted-foreground">
        {error || "Video content not available or could not be loaded."}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className={`relative rounded-md overflow-hidden bg-black hover:shadow-md ${HOVER_TRANSITION}`}>
        {/* Video element with progressive loading */}
        <video 
          controls
          src={videoUrl || undefined}
          poster={posterUrl || undefined}
          className="w-full max-h-[400px]"
          preload="metadata"
          style={{ display: 'block' }}
        />
        
        {/* Overlay loading indicator while full video loads */}
        {posterCreated && !videoIsReady && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-3 w-3 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading video...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Show transcription immediately if available */}
      {transcription && (
        <div className="mt-6 mb-4">
          <h3 className="text-sm font-medium mb-2">Video Transcription</h3>
          <div className={`p-3 bg-muted/40 rounded-md ${HOVER_TRANSITION}`}>
            <p className="whitespace-pre-wrap">{transcription}</p>
          </div>
        </div>
      )}
      
      {/* Show additional text immediately if available */}
      {additionalText && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Additional Notes</h3>
          <div className={`whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base ${HOVER_TRANSITION}`}>
            {additionalText}
          </div>
        </div>
      )}
    </div>
  );
}
