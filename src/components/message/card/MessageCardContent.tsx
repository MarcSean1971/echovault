
import React from "react";
import { Paperclip } from "lucide-react";
import { Message } from "@/types/message";
import { MessageTimer } from "@/components/message/MessageTimer";
import { extractTranscription } from "@/utils/messageFormatUtils";

interface MessageCardContentProps {
  message: Message;
  isArmed: boolean;
  deadline: Date | null;
  condition: any;
  transcription: string | null;
}

export function MessageCardContent({ 
  message, 
  isArmed, 
  deadline, 
  condition,
  transcription
}: MessageCardContentProps) {
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div>
      {message.message_type === 'text' ? (
        <p className="line-clamp-3">
          {message.content || "No content"}
        </p>
      ) : message.message_type === 'voice' ? (
        <div className="border-l-4 pl-2 border-primary/30">
          <p className="text-muted-foreground italic text-sm">
            {transcription ? 
              `"${transcription.slice(0, 120)}${transcription.length > 120 ? '...' : ''}"` : 
              'Voice message (no transcription available)'}
          </p>
        </div>
      ) : message.message_type === 'video' ? (
        <div className="border-l-4 pl-2 border-primary/30">
          <p className="text-muted-foreground italic text-sm">
            {transcription ? 
              `"${transcription.slice(0, 120)}${transcription.length > 120 ? '...' : ''}"` : 
              'Video message (no transcription available)'}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground italic">
          Unknown message type
        </p>
      )}
      
      {hasAttachments && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <Paperclip className="h-4 w-4 mr-1" />
            <span>{message.attachments!.length} attachment{message.attachments!.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
      
      {condition && (
        <div className="mt-3 pt-3 border-t">
          <MessageTimer deadline={deadline} isArmed={isArmed} />
        </div>
      )}
    </div>
  );
}
