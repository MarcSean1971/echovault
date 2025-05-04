
import React from "react";

interface TextMessageContentProps {
  content: string | null;
}

export function TextMessageContent({ content }: TextMessageContentProps) {
  return (
    <div className="prose max-w-none">
      {content || <span className="text-muted-foreground">No content available</span>}
    </div>
  );
}
