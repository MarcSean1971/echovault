
import React, { useState } from "react";
import { FileIcon } from "lucide-react";
import { AudioPlayer } from "@/components/media/AudioPlayer";

interface AudioMessageContentProps {
  mediaUrl: string | null;
  transcription: string | null;
  loading: boolean;
}

export function AudioMessageContent({ mediaUrl, transcription, loading }: AudioMessageContentProps) {
  const [showTranscription, setShowTranscription] = useState(false);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading voice message...</p>
      </div>
    );
  }

  if (!mediaUrl) {
    return (
      <div className="text-center py-8 border rounded-md">
        <FileIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">
          Voice message unavailable
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          The audio file might be missing or inaccessible
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AudioPlayer src={mediaUrl} className="w-full" />
      
      {transcription && (
        <div className="mt-4">
          <button 
            onClick={() => setShowTranscription(!showTranscription)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showTranscription ? "Hide" : "Show"} Transcription
          </button>
          
          {showTranscription && (
            <div className="mt-2 p-3 border rounded-md bg-muted/30">
              <p className="italic text-sm">"{transcription}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
