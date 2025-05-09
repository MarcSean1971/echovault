
import React from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface VideoTranscriptionProps {
  transcription: string | null;
  isTranscribing: boolean;
}

export function VideoTranscription({ 
  transcription, 
  isTranscribing 
}: VideoTranscriptionProps) {
  if (!transcription && !isTranscribing) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium">Video Transcription</h3>
      <Card className="p-3 bg-muted/40">
        {isTranscribing ? (
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            <div className="animate-pulse">Transcribing video...</div>
          </div>
        ) : (
          <Textarea
            value={transcription || ""}
            readOnly
            className="min-h-[100px] bg-transparent border-0 focus-visible:ring-0 resize-none"
            placeholder="Transcription will appear here after processing..."
          />
        )}
      </Card>
    </div>
  );
}
