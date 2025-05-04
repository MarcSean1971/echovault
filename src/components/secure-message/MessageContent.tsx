
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageContentProps {
  message: any;
}

export function MessageContent({ message }: MessageContentProps) {
  const renderMessageContent = () => {
    if (message.message_type === "text") {
      return (
        <div className="prose max-w-none">
          {message.content}
        </div>
      );
    } else if (message.message_type === "audio") {
      const audioData = JSON.parse(message.content);
      
      return (
        <div className="space-y-4">
          <p className="text-lg">This message contains audio content.</p>
          <audio controls className="w-full">
            <source src={audioData.audioUrl} type="audio/mp4" />
            Your browser does not support the audio element.
          </audio>
          
          {audioData.transcription && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="font-semibold mb-2">Transcription:</p>
              <p>{audioData.transcription}</p>
            </div>
          )}
        </div>
      );
    } else if (message.message_type === "video") {
      const videoData = JSON.parse(message.content);
      
      return (
        <div className="space-y-4">
          <p className="text-lg">This message contains video content.</p>
          <video controls className="w-full rounded-md">
            <source src={videoData.videoUrl} type="video/mp4" />
            Your browser does not support the video element.
          </video>
          
          {videoData.transcription && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="font-semibold mb-2">Transcription:</p>
              <p>{videoData.transcription}</p>
            </div>
          )}
        </div>
      );
    } else {
      return <p>Unsupported message type.</p>;
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
          <h1 className="text-2xl font-bold mb-1">{message.title}</h1>
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
