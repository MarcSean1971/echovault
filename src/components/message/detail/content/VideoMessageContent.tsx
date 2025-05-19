
import React, { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseVideoContent } from "@/services/messages/mediaService";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Progress } from "@/components/ui/progress";

export function VideoMessageContent({ message }: { message: Message }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Process video asynchronously without blocking the UI
  useEffect(() => {
    console.log("[VideoMessageContent] Component mounted - starting non-blocking process");
    
    // Create a simple placeholder immediately
    const createPlaceholder = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create a gradient for the placeholder
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f0f0f0');
        gradient.addColorStop(1, '#e0e0e0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add a play icon hint
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 40, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(canvas.width/2 - 15, canvas.height/2 - 20);
        ctx.lineTo(canvas.width/2 - 15, canvas.height/2 + 20);
        ctx.lineTo(canvas.width/2 + 25, canvas.height/2);
        ctx.closePath();
        ctx.fill();
      }
      
      // Set placeholder immediately
      const placeholderUrl = canvas.toDataURL();
      setPosterUrl(placeholderUrl);
    };
    
    // Create placeholder immediately
    createPlaceholder();
    
    // Use requestAnimationFrame to schedule non-blocking processing
    requestAnimationFrame(() => {
      const processVideoData = async () => {
        // First check if we have video content to process
        const contentToUse = message.video_content || message.content;
        if (!contentToUse) {
          console.log("[VideoMessageContent] No video content available");
          return;
        }
        
        try {
          // Start processing indication
          setIsProcessing(true);
          setProgress(10);
          
          // Parse video data - lightweight operation
          const { videoData } = parseVideoContent(contentToUse);
          
          if (!videoData) {
            console.log("[VideoMessageContent] No video data found");
            setIsProcessing(false);
            return;
          }
          
          setProgress(30);
          
          // Now process the video data in chunks using requestAnimationFrame to avoid blocking
          const chunkSize = 500000; // 500KB chunks
          const binaryString = window.atob(videoData);
          const totalChunks = Math.ceil(binaryString.length / chunkSize);
          const bytes = new Uint8Array(binaryString.length);
          
          let processedChunks = 0;
          
          const processNextChunk = () => {
            const start = processedChunks * chunkSize;
            const end = Math.min(start + chunkSize, binaryString.length);
            
            // Process this chunk
            for (let i = start; i < end; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            processedChunks++;
            const progressValue = 30 + Math.floor((processedChunks / totalChunks) * 60);
            setProgress(progressValue);
            
            if (processedChunks < totalChunks) {
              // Schedule next chunk with requestAnimationFrame to avoid blocking
              requestAnimationFrame(processNextChunk);
            } else {
              // All chunks processed, create blob and URL
              try {
                const blob = new Blob([bytes], { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                
                console.log("[VideoMessageContent] Video processed successfully");
                setVideoUrl(url);
                setProgress(100);
                setIsProcessing(false);
              } catch (e) {
                console.error("[VideoMessageContent] Error creating blob:", e);
                setError("Error processing video");
                setIsProcessing(false);
              }
            }
          };
          
          // Start processing the first chunk
          processNextChunk();
          
        } catch (e) {
          console.error("[VideoMessageContent] Error processing video:", e);
          setError("Error processing video data");
          setIsProcessing(false);
        }
      };
      
      processVideoData();
    });
    
    return () => {
      // Clean up resources
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (posterUrl && posterUrl.startsWith('blob:')) URL.revokeObjectURL(posterUrl);
    };
  }, [message.video_content, message.content]);
  
  return (
    <div className="space-y-4">
      <div className={`relative rounded-md overflow-hidden bg-black/5 hover:shadow-md ${HOVER_TRANSITION}`}>
        {videoUrl ? (
          // Show actual video when ready
          <video 
            controls
            src={videoUrl}
            poster={posterUrl || undefined}
            className="w-full max-h-[400px]"
            preload="metadata"
          />
        ) : (
          // Show placeholder or loading state
          <div className="aspect-video bg-muted/30 flex items-center justify-center">
            {isProcessing ? (
              <div className="w-full max-w-md px-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Loading video...</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2 w-full" 
                  indicatorClassName={progress >= 100 ? "bg-green-500" : ""} 
                />
              </div>
            ) : error ? (
              <div className="text-center p-4 text-muted-foreground">
                <p>{error}</p>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse">
                  <img src={posterUrl || undefined} alt="Video placeholder" className="max-h-[400px] w-full" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
