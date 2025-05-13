
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
  // Helper function to clean text content if it's in JSON format
  const cleanTextContent = (text: string | null): string | null => {
    if (!text) return null;
    
    // If content appears to be JSON, try to extract just the text
    if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(text);
        // Try to extract plain text from common fields
        if (parsed.text) return parsed.text;
        if (parsed.content) return parsed.content;
        if (parsed.message) return parsed.message;
        if (parsed.additionalText) return parsed.additionalText;
        
        // Return stringified JSON with formatting removed as fallback
        const stringified = JSON.stringify(parsed);
        if (stringified !== "{}") {
          return stringified.replace(/[{}"]/g, '').replace(/:/g, ': ').replace(/,/g, ', ');
        }
      } catch (e) {
        // Not valid JSON, return as is
        return text;
      }
    }
    
    return text;
  };

  // Clean the additional text if needed
  const cleanedAdditionalText = cleanTextContent(additionalText);
  
  return (
    <>
      {/* First show video content */}
      <div className="mb-6">
        <VideoMessageContent message={message} />
      </div>
      
      {/* Then show transcription if available */}
      {transcription && (
        <div className="mt-6 mb-4">
          <h3 className="text-sm font-medium mb-2">Video Transcription</h3>
          <div className={`p-3 bg-muted/40 rounded-md ${HOVER_TRANSITION}`}>
            <p className="whitespace-pre-wrap">{transcription}</p>
          </div>
        </div>
      )}
      
      {/* Show additional text if available - now rendering directly instead of using TextMessageContent */}
      {cleanedAdditionalText && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Additional Notes</h3>
          <div className={`whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base ${HOVER_TRANSITION}`}>
            {cleanedAdditionalText}
          </div>
        </div>
      )}
    </>
  );
}
