
import React from "react";
import { CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getMessageIcon } from "@/utils/messageFormatUtils";
import { Message } from "@/types/message";
import { Shield, Video, File } from "lucide-react";
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
      <div className="flex items-start gap-2">
        <div className={`mt-1 relative ${HOVER_TRANSITION} group-hover:scale-105`}>
          {getMessageIcon(message.message_type)}
          {isPanicTrigger && (
            <Shield className="h-4 w-4 text-red-500 absolute top-0 left-0 transform -translate-x-full -translate-y-full" />
          )}
        </div>
        <div className="min-h-[3rem] flex flex-col justify-start">
          <CardTitle className="text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
            {message.title}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            {formatDate(message.created_at)}
            
            {/* Video icon if message has video content */}
            {hasVideo && (
              <Video className={`h-3.5 w-3.5 text-muted-foreground ml-1 ${HOVER_TRANSITION}`} />
            )}
            
            {/* File icon if message has attachments */}
            {hasAttachments && (
              <File className={`h-3.5 w-3.5 text-muted-foreground ml-1 ${HOVER_TRANSITION}`} />
            )}
          </p>
        </div>
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
