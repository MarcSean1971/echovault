
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
  
  // Debug logging
  console.log("TextMessageContent: Rendering with content:", displayContent ? 
    (displayContent.length > 50 ? displayContent.substring(0, 50) + "..." : displayContent) : "null");
  
  return (
    displayContent ? (
      <div className={`whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base ${HOVER_TRANSITION}`}>
        {displayContent}
      </div>
    ) : (
      <span className="text-muted-foreground italic">No content</span>
    )
  );
}
