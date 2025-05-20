
import { MessageCondition } from "@/types/message";
import { MessageItem } from "./MessageItem";
import { MessageDetails } from "../types";

interface MessageListProps {
  messages: MessageCondition[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  isLoading: boolean;
  messageDetails: Record<string, MessageDetails>;
  getAttachmentInfo: (messageId: string) => {
    counts: {
      text: number;
      video: number;
      audio: number;
      other: number;
    };
    total: number;
  } | null;
}

export function MessageList({ 
  messages,
  selectedId,
  setSelectedId,
  isLoading,
  messageDetails,
  getAttachmentInfo
}: MessageListProps) {
  if (isLoading) {
    return <div className="text-center py-4">Loading message details...</div>;
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto py-4 space-y-2">
      {messages.map((message) => {
        const details = messageDetails[message.message_id];
        const attachmentInfo = details ? getAttachmentInfo(message.message_id) : null;
        
        return (
          <MessageItem 
            key={message.message_id}
            message={message}
            details={details}
            attachmentInfo={attachmentInfo}
            isSelected={selectedId === message.message_id}
            onSelect={setSelectedId}
          />
        );
      })}
    </div>
  );
}
