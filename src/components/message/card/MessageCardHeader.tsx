
import React from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getMessageIcon } from "@/utils/messageFormatUtils";
import { Message } from "@/types/message";
import { Shield } from "lucide-react";

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
        <div className="mt-1 relative">
          {getMessageIcon(message.message_type)}
          {isPanicTrigger && (
            <Shield className="h-3 w-3 text-red-500 absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2" />
          )}
        </div>
        <div className="min-h-[3rem] flex flex-col justify-start">
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
