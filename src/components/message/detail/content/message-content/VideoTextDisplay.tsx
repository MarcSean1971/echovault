
import React from "react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface VideoTextDisplayProps {
  transcription: string | null;
  displayText: string | null;
}

export function VideoTextDisplay({ transcription, displayText }: VideoTextDisplayProps) {
  return (
    <>
      {/* Show transcription immediately if available */}
      {transcription && (
        <div className="mt-6 mb-4">
          <h3 className="text-sm font-medium mb-2">Video Transcription</h3>
          <div className={`p-3 bg-muted/40 rounded-md ${HOVER_TRANSITION}`}>
            <p className={`whitespace-pre-wrap ${HOVER_TRANSITION}`}>{transcription}</p>
          </div>
        </div>
      )}
      
      {/* Show additional text if available */}
      {displayText && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Additional Notes</h3>
          <div className={`whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base ${HOVER_TRANSITION}`}>
            {displayText}
          </div>
        </div>
      )}
    </>
  );
}
