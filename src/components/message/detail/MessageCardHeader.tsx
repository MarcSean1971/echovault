
import React from "react";
import { MessageTypeIcon } from "@/components/message/detail/MessageTypeIcon";
import { Message } from "@/types/message";

interface MessageCardHeaderProps {
  message: Message;
  formatDate: (dateString: string) => string;
}

export function MessageCardHeader({ message, formatDate }: MessageCardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MessageTypeIcon messageType={message.message_type} />
          <h1 className="text-xl md:text-2xl font-semibold">{message.title}</h1>
        </div>
        
        {/* Desktop - Last updated */}
        <p className="text-xs text-muted-foreground hidden md:block">
          {message.updated_at !== message.created_at ? 
            `Last updated: ${formatDate(message.updated_at)}` : 
            `Created: ${formatDate(message.created_at)}`}
        </p>
      </div>
    </div>
  );
}
