
import React from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getMessageIcon } from "@/utils/messageFormatUtils";
import { Message } from "@/types/message";

interface MessageCardHeaderProps {
  message: Message;
  isArmed: boolean;
  formatDate: (dateString: string) => string;
}

export function MessageCardHeader({ message, isArmed, formatDate }: MessageCardHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div className="flex items-start gap-2">
        <div className="mt-1">
          {getMessageIcon(message.message_type)}
        </div>
        <div className="min-h-[3rem] flex flex-col justify-center">
          <CardTitle className="text-lg line-clamp-2 leading-tight">
            {message.title}
          </CardTitle>
        </div>
      </div>
      
      {isArmed && (
        <StatusBadge status="armed" size="sm">
          Armed
        </StatusBadge>
      )}
    </div>
  );
}
