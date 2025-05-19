
import React, { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseVideoContent } from "@/services/messages/mediaService";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export function VideoContentSection({ 
  message, 
  additionalText, 
  transcription 
}: { 
  message: Message; 
  additionalText: string | null;
  transcription: string | null;
}) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Show text content immediately
  const displayText = message.text_content || additionalText;
  
  // Use a web worker for video processing without blocking the UI
  useEffect(() => {
    // Mark component as mounted
    console.log("[VideoContentSection] Component mounted - showing content immediately");
    
    // Show transcription and text content immediately
    // Process video asynchronously to avoid blocking the UI
    
    const processVideoAsync = () => {
      // First check if we have video content to process
      const contentToUse = message.video_content || message.content;
      if (!contentToUse) {
        console.log("[VideoContentSection] No video content available");
        return;
      }
      
      try {
        // Start processing indication
        setIsProcessing(true);
        setProgress(10);
        
        // Use setTimeout to defer heavy processing
        setTimeout(() => {
          try {
            console.log("[VideoContentSection] Starting deferred video processing");
            // Extract just the video data - lighter operation
            const { videoData } = parseVideoContent(contentToUse);
            
            if (!videoData) {
              console.log("[VideoContentSection] No video data found");
              setIsProcessing(false);
              return;
            }
            
            setProgress(30);
            
            // Create a simple placeholder first - very fast
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
            
            // Set the placeholder immediately
            const placeholderUrl = canvas.toDataURL();
            setPosterUrl(placeholderUrl);
            setProgress(50);
            
            // Now process the actual video in chunks to avoid blocking
            const chunkSize = 500000; // Process 500KB at a time
            const binaryString = window.atob(videoData);
            const totalChunks = Math.ceil(binaryString.length / chunkSize);
            const bytes = new Uint8Array(binaryString.length);
            
            // Process the data in chunks using requestAnimationFrame
            let processedChunks = 0;
            
            const processChunk = (chunkIndex) => {
              const start = chunkIndex * chunkSize;
              const end = Math.min(start + chunkSize, binaryString.length);
              
              // Process this chunk
              for (let i = start; i < end; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              processedChunks++;
              setProgress(50 + Math.floor((processedChunks / totalChunks) * 40));
              
              // If more chunks to process, schedule the next one
              if (processedChunks < totalChunks) {
                requestAnimationFrame(() => processChunk(processedChunks));
              } else {
                // All chunks processed
                finishProcessing(bytes);
              }
            };
            
            // Start processing the first chunk
            requestAnimationFrame(() => processChunk(0));
            
            // Final processing after all chunks are done
            const finishProcessing = (processedBytes) => {
              try {
                const blob = new Blob([processedBytes], { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                
                console.log("[VideoContentSection] Video processed successfully");
                setVideoUrl(url);
                setProgress(100);
                setIsProcessing(false);
              } catch (e) {
                console.error("[VideoContentSection] Error in final processing:", e);
                setError("Error processing video");
                setIsProcessing(false);
              }
            };
            
          } catch (e) {
            console.error("[VideoContentSection] Error in deferred processing:", e);
            setIsProcessing(false);
            setError("Error processing video data");
          }
        }, 100); // Short delay to let the UI render first
        
      } catch (e) {
        console.error("[VideoContentSection] Initial error:", e);
        setError("Error processing video");
        setIsProcessing(false);
      }
    };
    
    // Start the async processing
    processVideoAsync();
    
    // Cleanup function
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (posterUrl && posterUrl.startsWith('blob:')) URL.revokeObjectURL(posterUrl);
    };
  }, [message.video_content, message.content]);
  
  return (
    <div className="space-y-4">
      {/* Video container - show immediately with placeholder or loading state */}
      <div className={`relative rounded-md overflow-hidden bg-black/5 hover:shadow-md ${HOVER_TRANSITION}`}>
        {videoUrl ? (
          <video 
            controls
            src={videoUrl}
            poster={posterUrl || undefined}
            className="w-full max-h-[400px]"
            preload="metadata"
          />
        ) : (
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
      {displayText && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Additional Notes</h3>
          <div className={`whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base ${HOVER_TRANSITION}`}>
            {displayText}
          </div>
        </div>
      )}
    </div>
  );
}
