
import React, { useState, useEffect } from "react";
import { FileIcon } from "lucide-react";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { Message } from "@/types/message";

interface VideoMessageContentProps {
  mediaUrl?: string | null;
  transcription?: string | null;
  loading?: boolean;
  message: Message;
}

export function VideoMessageContent({ mediaUrl, transcription, loading, message }: VideoMessageContentProps) {
  const [showTranscription, setShowTranscription] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(mediaUrl || null);
  const [videoTranscription, setVideoTranscription] = useState<string | null>(transcription || null);
  
  // Parse message content on component mount or when message changes
  useEffect(() => {
    console.log("VideoMessageContent: Processing message content");
    
    // Cleanup function to revoke object URL on unmount or message change
    let urlToRevoke: string | null = null;
    
    if (!videoUrl && message.content) {
      try {
        const contentObj = JSON.parse(message.content);
        console.log("VideoMessageContent: Parsed content:", contentObj);
        
        if (contentObj.videoData) {
          // Create a blob URL for playback
          const videoBlob = base64ToBlob(contentObj.videoData, 'video/webm');
          console.log("VideoMessageContent: Created blob:", videoBlob.size);
          
          const url = URL.createObjectURL(videoBlob);
          console.log("VideoMessageContent: Created URL:", url);
          urlToRevoke = url;
          
          setVideoUrl(url);
          
          // Get transcription if available
          if (contentObj.transcription && !videoTranscription) {
            console.log("VideoMessageContent: Found transcription:", contentObj.transcription);
            setVideoTranscription(contentObj.transcription);
          }
        }
      } catch (e) {
        console.error("Error parsing video content:", e);
      }
    }
    
    // Cleanup effect
    return () => {
      if (urlToRevoke) {
        console.log("VideoMessageContent: Revoking URL:", urlToRevoke);
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [message.content, videoUrl, videoTranscription, mediaUrl]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading video message...</p>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="text-center py-8 border rounded-md">
        <FileIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">
          Video message unavailable
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          The video file might be missing or inaccessible
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <VideoPlayer 
        src={videoUrl} 
        className="w-full aspect-video" 
      />
      
      {videoTranscription && (
        <div className="mt-4">
          <button 
            onClick={() => setShowTranscription(!showTranscription)}
            className="text-sm font-medium text-primary hover:underline transition-colors duration-200"
          >
            {showTranscription ? "Hide" : "Show"} Transcription
          </button>
          
          {showTranscription && (
            <div className="mt-2 p-3 border rounded-md bg-muted/30">
              <p className="italic text-sm">"{videoTranscription}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
  
  // Helper function to convert base64 to blob
  function base64ToBlob(base64: string, type: string): Blob {
    try {
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type });
    } catch (e) {
      console.error("Error converting base64 to blob:", e);
      return new Blob([], { type });
    }
  }
}
