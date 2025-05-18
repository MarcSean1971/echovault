
import React, { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseVideoContent } from "@/services/messages/mediaService";
import { Card } from "@/components/ui/card";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function VideoMessageContent({ message }: { message: Message }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoIsReady, setVideoIsReady] = useState(false);
  
  // Parse the video content immediately but load the full video progressively
  useEffect(() => {
    // First check video_content field, then fall back to content if needed
    const contentToUse = message.video_content || message.content;
    
    if (!contentToUse) {
      setIsLoading(false);
      setError("No video content available");
      return;
    }
    
    try {
      // Set up a loading state indicator
      setIsLoading(true);
      
      // Parse video data from message content
      const { videoData, transcription: extractedTranscription } = parseVideoContent(contentToUse);
      
      // Extract transcription immediately - this is lightweight
      setTranscription(extractedTranscription);
      
      if (videoData) {
        try {
          // Create a tiny video poster first for immediate display
          // This works by creating a small version of the video that loads quickly
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
              setPosterUrl(previewUrl);
              setIsLoading(false);
            } catch (e) {
              console.error("Error creating video poster:", e);
              // If poster creation fails, we'll still try to load the full video
            }
          };
          
          // Start creating poster immediately
          createPoster();
          
          // Now load the full video in the background with low priority
          const loadFullVideo = () => {
            try {
              // Create a blob URL from the full base64 data
              const binaryString = window.atob(videoData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'video/webm' });
              const url = URL.createObjectURL(blob);
              setVideoUrl(url);
              setVideoIsReady(true);
              console.log("Full video loaded successfully:", url);
              console.log("Video blob size:", blob.size, "bytes");
            } catch (e) {
              console.error("Error creating video blob:", e);
              setError("Error processing video data");
              setIsLoading(false);
            }
          };
          
          // Use requestIdleCallback if available, otherwise setTimeout
          if ('requestIdleCallback' in window) {
            // @ts-ignore - TypeScript might not recognize this API
            window.requestIdleCallback(() => loadFullVideo(), { timeout: 2000 });
          } else {
            // Fallback to setTimeout with a slight delay to prioritize other content
            setTimeout(loadFullVideo, 300);
          }
        } catch (e) {
          console.error("Error creating video blob:", e);
          setError("Error processing video data");
          setIsLoading(false);
        }
      } else {
        console.log("No video data found in message content");
        setError("Video data not available");
        setIsLoading(false);
      }
      
    } catch (e) {
      console.error("Error parsing video content:", e);
      setError("Error parsing video content");
      setIsLoading(false);
    }
    
    // Clean up URLs on unmount
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      if (posterUrl) {
        URL.revokeObjectURL(posterUrl);
      }
    };
  }, [message.video_content, message.content]);
  
  // Render loading state
  if (isLoading && !posterUrl) {
    return (
      <div className="p-4 bg-muted/40 rounded-md text-center text-muted-foreground">
        <div className="animate-pulse">Loading video content...</div>
      </div>
    );
  }
  
  // Render error state
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
          // Add loading attribute for browsers that support it
          loading="lazy"
        />
        
        {/* Overlay loading indicator while full video loads */}
        {!videoIsReady && posterUrl && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">
            <div className="flex items-center justify-center">
              <span className="animate-pulse">Loading full video...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
