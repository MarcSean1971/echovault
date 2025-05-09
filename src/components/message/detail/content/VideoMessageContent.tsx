
import React, { useState, useEffect } from "react";
import { Message } from "@/types/message";
import { parseVideoContent } from "@/services/messages/mediaService";
import { Card } from "@/components/ui/card";

export function VideoMessageContent({ message }: { message: Message }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [additionalText, setAdditionalText] = useState<string | null>(null);
  
  useEffect(() => {
    if (message.content) {
      try {
        // Parse video data from message content
        const { videoData } = parseVideoContent(message.content);
        
        if (videoData) {
          // Create a blob URL from the base64 data
          const binaryString = window.atob(videoData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
        }
        
        // Check for additional text in the content
        try {
          const contentObj = JSON.parse(message.content);
          if (contentObj.additionalText) {
            setAdditionalText(contentObj.additionalText);
          }
        } catch (e) {
          console.error("Error parsing additional text:", e);
        }
      } catch (e) {
        console.error("Error parsing video content:", e);
      }
    }
    
    // Clean up URLs on unmount
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [message.content]);
  
  if (!videoUrl) {
    return (
      <div className="p-4 bg-muted/40 rounded-md text-center text-muted-foreground">
        Video content not available or could not be loaded.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="relative rounded-md overflow-hidden bg-black">
        <video 
          controls
          src={videoUrl}
          className="w-full max-h-[400px]"
        />
      </div>
      
      {additionalText && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium">Additional Text</h3>
          <Card className="p-3 bg-muted/40">
            <p className="whitespace-pre-wrap">{additionalText}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
