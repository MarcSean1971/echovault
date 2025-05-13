
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
    
    // Skip processing if it doesn't look like JSON
    if (!text.trim().startsWith('{') || !text.trim().endsWith('}')) {
      console.log("VideoContentSection: Text doesn't look like JSON, using as is:", text.substring(0, 30));
      return text;
    }
    
    try {
      // Check if this text has been processed already by looking for JSON structure
      const parsed = JSON.parse(text);
      
      // Try to extract plain text from common fields
      if (parsed.text) return parsed.text;
      if (parsed.content) return parsed.content;
      if (parsed.message) return parsed.message;
      if (parsed.additionalText) {
        // If additionalText itself is JSON, avoid nested processing
        const innerText = parsed.additionalText;
        if (typeof innerText === 'string' && !innerText.trim().startsWith('{')) {
          console.log("VideoContentSection: Using pre-extracted additionalText:", 
                     innerText.substring(0, 30));
          return innerText;
        }
        return parsed.additionalText;
      }
      
      // Return stringified JSON with formatting removed as fallback
      const stringified = JSON.stringify(parsed);
      if (stringified !== "{}") {
        return stringified.replace(/[{}"]/g, '').replace(/:/g, ': ').replace(/,/g, ', ');
      }
    } catch (e) {
      // Not valid JSON, return as is
      console.log("VideoContentSection: Failed to parse JSON, using as is:", text.substring(0, 30));
      return text;
    }
    
    return text;
  };

  // Debug logging to track the text transformation
  console.log("VideoContentSection: Original additionalText:", 
              additionalText ? additionalText.substring(0, 50) + "..." : "null");
  
  // Clean the additional text if needed
  const cleanedAdditionalText = cleanTextContent(additionalText);
  
  // Log the cleaned text
  console.log("VideoContentSection: Cleaned additionalText:", 
              cleanedAdditionalText ? cleanedAdditionalText.substring(0, 50) + "..." : "null");
  
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
