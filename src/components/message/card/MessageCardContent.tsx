
import React from "react";
import { Message, MessageCondition } from "@/types/message";
import { MessageTimer } from "../MessageTimer";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  deadline: Date | null;
  condition: MessageCondition | null;
  transcription: string | null;
  refreshTrigger?: number;
}

export function MessageCardContent({
  message,
  isArmed,
  deadline,
  condition,
  transcription,
  refreshTrigger
}: MessageCardContentProps) {
  // Choose what to display as the main content
  const displayContent = () => {
    if (message.message_type === "text") {
      // For text messages, show the actual content
      return message.content || "No content";
    }
    
    // For media messages (audio/video), show transcription if available
    if (transcription) {
      return transcription;
    }
    
    // Default case
    return `${message.message_type.charAt(0).toUpperCase() + message.message_type.slice(1)} message`;
  };

  return (
    <div>
      {/* Message Timer (only show if there's a condition and it has a deadline) */}
      {condition && deadline && (
        <MessageTimer deadline={deadline} isArmed={isArmed} refreshTrigger={refreshTrigger} />
      )}
      
      {/* Message Content */}
      <div className="pl-7">
        <p className="line-clamp-3 text-sm text-gray-600">{displayContent()}</p>
      </div>
    </div>
  );
}
