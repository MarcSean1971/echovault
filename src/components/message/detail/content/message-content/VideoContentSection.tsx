
import React from "react";
import { Message } from "@/types/message";
import { VideoMessageContent } from "../VideoMessageContent";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface VideoContentSectionProps {
  message: Message;
  additionalText: string | null;
  transcription: string | null;
}

export function VideoContentSection({ 
  message, 
  additionalText, 
  transcription 
}: VideoContentSectionProps) {
  // Use the text_content directly if available, otherwise use additionalText from the hook
  const displayText = message.text_content || additionalText;
  
  return (
    <>
      {/* First show video content with progressive loading */}
      <div className="mb-6">
        <VideoMessageContent message={message} />
      </div>
      
      {/* Then show transcription if available - this loads quickly */}
      {transcription && (
        <div className="mt-6 mb-4">
          <h3 className="text-sm font-medium mb-2">Video Transcription</h3>
          <div className={`p-3 bg-muted/40 rounded-md ${HOVER_TRANSITION}`}>
            <p className="whitespace-pre-wrap">{transcription}</p>
          </div>
        </div>
      )}
      
      {/* Show additional text if available - also loads quickly */}
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
