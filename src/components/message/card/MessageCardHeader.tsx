
import React from "react";
import { CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Message } from "@/types/message";
import { Video, File } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageCardHeaderProps {
  message: Message;
  isArmed: boolean;
  formatDate: (dateString: string) => string;
  isPanicTrigger?: boolean;
}

export function MessageCardHeader({ message, isArmed, formatDate, isPanicTrigger = false }: MessageCardHeaderProps) {
  // Check if message has video content
  const hasVideo = message.message_type === 'video' || message.video_content;
  
  // Check if message has file attachments
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div className="flex justify-between items-start">
      <div className="flex flex-col justify-start">
        <CardTitle className="text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
          {message.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
          {formatDate(message.created_at)}
          
          {/* Video icon if message has video content */}
          {hasVideo && (
            <Video className={`h-3.5 w-3.5 text-muted-foreground ml-1 hover:text-primary ${HOVER_TRANSITION}`} />
          )}
          
          {/* File icon if message has attachments */}
          {hasAttachments && (
            <File className={`h-3.5 w-3.5 text-muted-foreground ml-1 hover:text-primary ${HOVER_TRANSITION}`} />
          )}
        </p>
      </div>
      
      {/* Restored armed status badge in header */}
      {isArmed && (
        <StatusBadge status="armed" size="sm" className="animate-pulse">
          Armed
        </StatusBadge>
      )}
    </div>
  );
}
