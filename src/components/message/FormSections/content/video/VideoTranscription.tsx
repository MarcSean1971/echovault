
import React from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface VideoTranscriptionProps {
  transcription: string | null;
  isTranscribing: boolean;
}

export function VideoTranscription({ 
  transcription, 
  isTranscribing 
}: VideoTranscriptionProps) {
  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium">Video Transcription</h3>
      <Card className="p-3 bg-muted/40 relative">
        {isTranscribing ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 mr-2 animate-spin" />
            <div className="animate-pulse">Transcribing video...</div>
          </div>
        ) : (
          <Textarea
            value={transcription || ""}
            readOnly
            className="min-h-[100px] bg-transparent border-0 focus-visible:ring-0 resize-none hover:bg-muted/20 transition-colors"
            placeholder={transcription === null ? "Transcription will appear here after processing..." : ""}
          />
        )}
      </Card>
    </div>
  );
}
