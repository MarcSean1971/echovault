
import React from "react";
import { Message } from "@/types/message";
import { TextMessageContent } from "../TextMessageContent";

interface TextContentSectionProps {
  message: Message;
  content?: string | null;
}

export function TextContentSection({ message, content }: TextContentSectionProps) {
  return (
    <div className="mb-4">
      <TextMessageContent message={message} content={content} />
    </div>
  );
}
