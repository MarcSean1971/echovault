
import React, { useState, useEffect } from "react";
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
  // Track when component mounts to trigger early video loading
  const [isMounted, setIsMounted] = useState(false);
  
  // Mark component as mounted to start video loading process
  useEffect(() => {
    console.log("[VideoContentSection] Component mounted, ready to display video");
    setIsMounted(true);
    
    // Log the transcription status for debugging
    if (transcription) {
      console.log("[VideoContentSection] Transcription available, will display after video");
    }
  }, [transcription]);
  
  // Use the text_content directly if available, otherwise use additionalText from the hook
  const displayText = message.text_content || additionalText;
  
  return (
    <>
      {/* First show video content with progressive loading - this loads quickly */}
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
