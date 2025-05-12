
import React from "react";
import { Message } from "@/types/message";

interface TextMessageContentProps {
  content?: string | null;
  message: Message;
}

export function TextMessageContent({ message, content }: TextMessageContentProps) {
  // Use the passed content if available, otherwise use message.content
  const displayContent = content || message.content;
  
  return (
    displayContent ? (
      <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base">
        {displayContent}
      </div>
    ) : (
      <span className="text-muted-foreground italic">No content</span>
    )
  );
}
