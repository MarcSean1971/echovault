
import React from "react";
import { MessageSquare, File, Video } from "lucide-react";
import { Message } from "@/types/message";

interface MessageTypeIconProps {
  messageType: Message["message_type"];
  className?: string;
}

export function MessageTypeIcon({ messageType, className = "h-5 w-5" }: MessageTypeIconProps) {
  switch (messageType) {
    case 'text':
      return <MessageSquare className={className} />;
    case 'voice':
      return <File className={className} />;
    case 'video':
      return <Video className={className} />;
    default:
      return <MessageSquare className={className} />;
  }
}
