
import React from "react";
import { CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Message, MessageCondition } from "@/types/message";
import { Video, File, Users } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageCardHeaderProps {
  message: Message;
  isArmed: boolean;
  formatDate: (dateString: string) => string;
  isPanicTrigger?: boolean;
  condition?: MessageCondition | null;
}

export function MessageCardHeader({ message, isArmed, formatDate, isPanicTrigger = false, condition }: MessageCardHeaderProps) {
  // Check if message has video content
  const hasVideo = message.message_type === 'video' || message.video_content;
  
  // Check if message has file attachments
  const hasAttachments = message.attachments && message.attachments.length > 0;

  // Get recipient count from condition
  const recipientCount = condition?.recipients?.length || 0;

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

          {/* Recipients icon with count */}
          {recipientCount > 0 && (
            <div className="flex items-center ml-1">
              <Users className={`h-3.5 w-3.5 text-muted-foreground hover:text-primary ${HOVER_TRANSITION}`} />
              <span className="text-xs text-muted-foreground ml-0.5">{recipientCount}</span>
            </div>
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
