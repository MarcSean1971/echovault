
import React, { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseVideoContent } from "@/services/messages/mediaService";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function VideoMessageContent({ message }: { message: Message }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoIsReady, setVideoIsReady] = useState(false);
  const [posterCreated, setPosterCreated] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'initial' | 'poster' | 'full'>('initial');
  
  // Parse the video content immediately and start progressive loading ASAP
  useEffect(() => {
    console.log("[VideoMessageContent] Component mounted, starting progressive loading IMMEDIATELY");
    
    // First check video_content field, then fall back to content if needed
    const contentToUse = message.video_content || message.content;
    
    if (!contentToUse) {
      console.log("[VideoMessageContent] No video content available");
      setIsLoading(false);
      setError("No video content available");
      return;
    }
    
    try {
      // Parse video data from message content - this happens immediately
      console.log("[VideoMessageContent] Parsing video content");
      const { videoData, transcription: extractedTranscription } = parseVideoContent(contentToUse);
      
      // Extract transcription immediately - this is lightweight
      setTranscription(extractedTranscription);
      
      if (videoData) {
        try {
          // STEP 1: Create a placeholder immediately while we work on the poster
          setLoadingStage('poster');
          
          // STEP 2: Immediately start creating poster
          const createPoster = async () => {
            try {
              // Create minimal blob for poster/thumbnail
              const binaryString = window.atob(videoData);
              // Only process a small portion for the poster (first 100KB is usually enough for a frame)
              const previewBytes = new Uint8Array(Math.min(100000, binaryString.length));
              for (let i = 0; i < previewBytes.length; i++) {
                previewBytes[i] = binaryString.charCodeAt(i);
              }
              const previewBlob = new Blob([previewBytes], { type: 'video/webm' });
              const previewUrl = URL.createObjectURL(previewBlob);
              
              console.log("[VideoMessageContent] Poster image created successfully");
              setPosterUrl(previewUrl);
              setPosterCreated(true);
              setIsLoading(false); // We can show something immediately now
            } catch (e) {
              console.error("[VideoMessageContent] Error creating video poster:", e);
              // If poster creation fails, we'll still try to load the full video
            }
          };
          
          // Start creating poster immediately without delay
          createPoster();
          
          // STEP 3: Load full video in the background
          console.log("[VideoMessageContent] Starting to load full video in background");
          setLoadingStage('full');
          
          const loadFullVideo = () => {
            try {
              console.log("[VideoMessageContent] Processing full video data");
              // Create a blob URL from the full base64 data
              const binaryString = window.atob(videoData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'video/webm' });
              const url = URL.createObjectURL(blob);
              
              console.log("[VideoMessageContent] Full video processed successfully:", 
                          "blob size:", blob.size, "bytes");
              setVideoUrl(url);
              setVideoIsReady(true);
            } catch (e) {
              console.error("[VideoMessageContent] Error creating video blob:", e);
              setError("Error processing video data");
              setIsLoading(false);
            }
          };
          
          // Use different scheduling methods based on browser support
          if ('requestIdleCallback' in window) {
            // Use requestIdleCallback with a timeout to ensure it eventually runs
            // @ts-ignore - TypeScript might not recognize this API
            window.requestIdleCallback(() => loadFullVideo(), { timeout: 1000 });
          } else {
            // Fallback to setTimeout with a slight delay to prioritize other content
            setTimeout(loadFullVideo, 10); // Reduced from 100ms to be near-immediate
          }
        } catch (e) {
          console.error("[VideoMessageContent] Error processing video data:", e);
          setError("Error processing video data");
          setIsLoading(false);
        }
      } else {
        console.log("[VideoMessageContent] No video data found in message content");
        setError("Video data not available");
        setIsLoading(false);
      }
      
    } catch (e) {
      console.error("[VideoMessageContent] Error parsing video content:", e);
      setError("Error parsing video content");
      setIsLoading(false);
    }
    
    // Clean up URLs on unmount
    return () => {
      console.log("[VideoMessageContent] Component unmounting, cleaning up resources");
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      if (posterUrl) {
        URL.revokeObjectURL(posterUrl);
      }
    };
  }, [message.video_content, message.content]);
  
  // Render loading state - only show if we have nothing else
  if (isLoading && !posterUrl) {
    return (
      <div className="p-4 bg-muted/40 rounded-md text-center text-muted-foreground animate-pulse">
        <div className="flex items-center justify-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>Loading video preview...</div>
        </div>
      </div>
    );
  }
  
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
          src={videoUrl}
          poster={posterUrl || undefined}
          className="w-full max-h-[400px]"
          preload="metadata"
          style={{ display: 'block' }}
          // Show loading indicator until video can play
          onLoadedData={() => setIsLoading(false)}
        />
        
        {/* Overlay loading indicator while full video loads */}
        {posterCreated && !videoIsReady && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-3 w-3 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading full video...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
