
import React from "react";
import { Message } from "@/types/message";
import { TextMessageContent } from "../TextMessageContent";

interface TextContentSectionProps {
  message: Message;
  content?: string | null;
  additionalText?: string | null;
}

export function TextContentSection({ message, content, additionalText }: TextContentSectionProps) {
  // If content is explicitly provided, use that. Otherwise, try additionalText, then let TextMessageContent handle fallbacks
  const displayContent = content || additionalText;
  
  return (
    <div className="mb-4">
      <TextMessageContent message={message} content={displayContent} />
    </div>
  );
}
