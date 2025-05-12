
import React, { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseVideoContent } from "@/services/messages/mediaService";
import { Card } from "@/components/ui/card";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function VideoMessageContent({ message }: { message: Message }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!message.content) {
      setIsLoading(false);
      setError("No video content available");
      return;
    }
    
    try {
      // Parse video data from message content
      const { videoData, transcription: extractedTranscription } = parseVideoContent(message.content);
      
      if (videoData) {
        try {
          // Create a blob URL from the base64 data
          const binaryString = window.atob(videoData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          console.log("Video URL created successfully:", url);
          console.log("Video blob size:", blob.size, "bytes");
        } catch (e) {
          console.error("Error creating video blob:", e);
          setError("Error processing video data");
        }
      } else {
        console.log("No video data found in message content");
        setError("Video data not available");
      }
      
      // Extract transcription
      setTranscription(extractedTranscription);
      
    } catch (e) {
      console.error("Error parsing video content:", e);
      setError("Error parsing video content");
    } finally {
      setIsLoading(false);
    }
    
    // Clean up URLs on unmount
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [message.content]);
  
  if (isLoading) {
    return (
      <div className="p-4 bg-muted/40 rounded-md text-center text-muted-foreground">
        <div className="animate-pulse">Loading video content...</div>
      </div>
    );
  }
  
  if (error || !videoUrl) {
    return (
      <div className="p-4 bg-muted/40 rounded-md text-center text-muted-foreground">
        {error || "Video content not available or could not be loaded."}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="relative rounded-md overflow-hidden bg-black hover:shadow-md transition-shadow duration-300">
        <video 
          controls
          src={videoUrl}
          className="w-full max-h-[400px]"
          preload="metadata"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
}
