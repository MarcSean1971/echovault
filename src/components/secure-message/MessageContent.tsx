
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { TextMessageContent } from "./content/TextMessageContent";
import { AudioMessageContent } from "./content/AudioMessageContent";
import { VideoMessageContent } from "./content/VideoMessageContent";
import { UnknownMessageContent } from "./content/UnknownMessageContent";

interface MessageContentProps {
  message: any;
}

export function MessageContent({ message }: MessageContentProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  
  // Parse content for audio and video messages
  useEffect(() => {
    if (message.message_type === "audio" || message.message_type === "video") {
      try {
        const contentData = JSON.parse(message.content);
        setTranscription(contentData.transcription || null);
        
        if (message.message_type === "audio") {
          setAudioUrl(contentData.audioUrl || contentData.audioData || null);
        } else if (message.message_type === "video") {
          setVideoUrl(contentData.videoUrl || contentData.videoData || null);
        }
      } catch (e) {
        console.error("Error parsing message content:", e);
      }
    }
  }, [message]);
  
  const renderMessageContent = () => {
    switch (message.message_type) {
      case "text":
        return <TextMessageContent content={message.content} />;
      case "audio":
        return <AudioMessageContent audioUrl={audioUrl} transcription={transcription} />;
      case "video":
        return <VideoMessageContent videoUrl={videoUrl} transcription={transcription} />;
      default:
        return <UnknownMessageContent />;
    }
  };
  
  const renderLocation = () => {
    if (message.share_location && message.location_latitude && message.location_longitude) {
      return (
        <div className="mt-6 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-md">
          <h3 className="text-lg font-medium mb-2">📍 Location Shared</h3>
          <p className="mb-2">{message.location_name || "Unnamed location"}</p>
          <a 
            href={`https://maps.google.com/?q=${message.location_latitude},${message.location_longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline ${HOVER_TRANSITION}`}
          >
            View on Google Maps
          </a>
        </div>
      );
    }
    return null;
  };
  
  const renderAttachments = () => {
    if (message.attachments && message.attachments.length > 0) {
      return (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Attachments</h3>
          <ul className="space-y-2">
            {message.attachments.map((attachment: any, index: number) => (
              <li key={index} className="p-2 bg-muted rounded-md flex items-center">
                <span className="flex-1 truncate">{attachment.name}</span>
                <a 
                  href={attachment.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ${HOVER_TRANSITION}`}
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto p-6 overflow-hidden">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold mb-1">{message.title || 'Untitled Message'}</h1>
        </div>
        
        {renderMessageContent()}
        {renderLocation()}
        {renderAttachments()}
      </Card>
      
      <div className="w-full max-w-3xl mx-auto mt-6 text-center">
        <Button 
          variant="secondary" 
          onClick={() => window.history.back()}
          className={`hover:bg-secondary/90 ${HOVER_TRANSITION}`}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
