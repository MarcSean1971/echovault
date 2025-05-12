
import React from "react";
import { CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getMessageIcon } from "@/utils/messageFormatUtils";
import { Message } from "@/types/message";
import { Shield } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageCardHeaderProps {
  message: Message;
  isArmed: boolean;
  formatDate: (dateString: string) => string;
  isPanicTrigger?: boolean;
}

export function MessageCardHeader({ message, isArmed, formatDate, isPanicTrigger = false }: MessageCardHeaderProps) {
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
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(message.created_at)}
          </p>
        </div>
      </div>
      
      {/* Only show Armed status badge */}
      {isArmed && (
        <StatusBadge status="armed" size="sm" className="animate-pulse">
          Armed
        </StatusBadge>
      )}
    </div>
  );
}
