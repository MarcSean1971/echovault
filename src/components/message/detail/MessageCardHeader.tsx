
import React from "react";
import { MessageTypeIcon } from "@/components/message/detail/MessageTypeIcon";
import { Message } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageCardHeaderProps {
  message: Message;
  formatDate: (dateString: string) => string;
}

export function MessageCardHeader({ message, formatDate }: MessageCardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <div className={`mt-1 ${HOVER_TRANSITION}`}>
            <MessageTypeIcon messageType={message.message_type} />
          </div>
          <div className="min-h-[3rem] flex flex-col justify-center">
            <h1 className={`text-xl md:text-2xl font-semibold line-clamp-2 leading-tight ${HOVER_TRANSITION}`}>
              {message.title}
            </h1>
          </div>
        </div>
        
        {/* Desktop - Last updated */}
        <p className={`text-xs text-muted-foreground hidden md:block ml-7 ${HOVER_TRANSITION}`}>
          {message.updated_at !== message.created_at ? 
            `Last updated: ${formatDate(message.updated_at)}` : 
            `Created: ${formatDate(message.created_at)}`}
        </p>
      </div>
    </div>
  );
}
