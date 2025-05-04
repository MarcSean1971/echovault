
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface VideoMessageContentProps {
  videoUrl: string | null;
  transcription: string | null;
}

export function VideoMessageContent({ videoUrl, transcription }: VideoMessageContentProps) {
  const [showTranscription, setShowTranscription] = useState(false);
  
  if (!videoUrl) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Video content unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-lg">Video Message</p>
      <video controls className="w-full rounded-md">
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video element.
      </video>
      
      {transcription && (
        <div className="mt-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowTranscription(!showTranscription)}
            className={`text-sm font-medium text-primary p-0 h-auto ${HOVER_TRANSITION}`}
          >
            {showTranscription ? "Hide" : "Show"} Transcription
          </Button>
          
          {showTranscription && (
            <div className="mt-2 p-4 bg-muted rounded-md">
              <p className="font-semibold mb-2">Transcription:</p>
              <p>{transcription}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
