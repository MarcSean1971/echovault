
import React from "react";
import { Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface TextMessageContentProps {
  content?: string | null;
  message: Message;
}

export function TextMessageContent({ message, content }: TextMessageContentProps) {
  // Use the passed content if available, otherwise use message.content
  const displayContent = content || message.content;
  
  // Helper function to clean JSON content if needed
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
  
  // Clean the content if needed
  const cleanedContent = cleanTextContent(displayContent);
  
  // Debug logging
  console.log("TextMessageContent: Rendering with content:", cleanedContent ? 
    (cleanedContent.length > 50 ? cleanedContent.substring(0, 50) + "..." : cleanedContent) : "null");
  
  return (
    cleanedContent ? (
      <div className={`whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base ${HOVER_TRANSITION}`}>
        {cleanedContent}
      </div>
    ) : (
      <span className="text-muted-foreground italic">No content</span>
    )
  );
}
