
import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoTranscriptionProps {
  transcription: string | null;
  isTranscribing: boolean;
  error?: string | null;
}

export function VideoTranscription({ 
  transcription, 
  isTranscribing,
  error = null
}: VideoTranscriptionProps) {
  // Log the transcription for debugging
  useEffect(() => {
    console.log("VideoTranscription rendered with:", { 
      transcription: transcription ? transcription.substring(0, 30) + '...' : 'null',
      isTranscribing,
      hasError: !!error
    });
  }, [transcription, isTranscribing, error]);

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium">Video Transcription</h3>
      <Card className="p-3 bg-muted/40 relative">
        {isTranscribing ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 mr-2 animate-spin" />
            <div className="animate-pulse">Transcribing video audio...</div>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">{error}</AlertDescription>
          </Alert>
        ) : transcription ? (
          <Textarea
            value={transcription || ""}
            readOnly
            className="min-h-[100px] bg-transparent border-0 focus-visible:ring-0 resize-none hover:bg-muted/20 transition-colors"
          />
        ) : (
          <div className="flex items-center p-4 text-muted-foreground">
            <Info className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">
              Transcription will appear here after processing. For best results, ensure your video has clear audio.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
