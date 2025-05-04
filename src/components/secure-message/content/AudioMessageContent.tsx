
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface AudioMessageContentProps {
  audioUrl: string | null;
  transcription: string | null;
}

export function AudioMessageContent({ audioUrl, transcription }: AudioMessageContentProps) {
  const [showTranscription, setShowTranscription] = useState(false);
  
  if (!audioUrl) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Audio content unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-lg">Audio Message</p>
      <audio controls className="w-full">
        <source src={audioUrl} type="audio/mp4" />
        Your browser does not support the audio element.
      </audio>
      
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
