
import React from "react";
import { Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface TextMessageContentProps {
  content?: string | null;
  message: Message;
}

export function TextMessageContent({ message, content }: TextMessageContentProps) {
  // First try to use the passed content, then message.text_content, finally fall back to message.content
  const displayContent = content || message.text_content || message.content;
  
  // Helper function to clean JSON content if needed (for backward compatibility)
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
  
  return (
    cleanedContent ? (
      <div className={`whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base ${HOVER_TRANSITION} prose-headings:text-purple-900 prose-a:text-purple-600 hover:prose-a:text-purple-700`}>
        {cleanedContent}
      </div>
    ) : (
      <span className="text-muted-foreground italic">No content</span>
    )
  );
}
