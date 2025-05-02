
import React from "react";

interface TextMessageContentProps {
  content: string | null;
}

export function TextMessageContent({ content }: TextMessageContentProps) {
  return (
    <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base">
      {content || <span className="text-muted-foreground italic">No content</span>}
    </div>
  );
}
