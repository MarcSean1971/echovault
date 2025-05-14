
import React from "react";
import { MessageCondition, Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  deadline: Date | null;
  condition: MessageCondition | null;
  transcription?: string | null;
  isPanicTrigger?: boolean;
}

export function MessageCardContent({
  message,
  isArmed,
  deadline,
  condition,
  transcription,
  isPanicTrigger = false
}: MessageCardContentProps) {
  // Get the content to display (use transcription if available for video content)
  const displayContent = 
    message.message_type === 'video' && transcription ? 
    transcription : 
    (message.text_content || message.content);
  
  return (
    <div className="flex flex-col h-full">
      {/* Message content excerpt */}
      <div className="mb-4">
        <div className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
          {displayContent || "No content available"}
        </div>
      </div>
      
      {/* All badge indicators have been removed from content section */}
    </div>
  );
}
