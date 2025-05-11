
import React from "react";
import { Message } from "@/types/message";

interface TextMessageContentProps {
  content?: string | null;
  message: Message;
}

export function TextMessageContent({ message }: TextMessageContentProps) {
  return (
    <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base">
      {message.content || <span className="text-muted-foreground italic">No content</span>}
    </div>
  );
}
