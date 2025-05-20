
import { MessageCondition } from "@/types/message";
import { MessageItem } from "./MessageItem";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageListProps {
  messages: MessageCondition[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  messageTitles?: Record<string, string>;
  messageContents?: Record<string, string>;
}

export function MessageList({ 
  messages,
  selectedId,
  setSelectedId,
  messageTitles = {},
  messageContents = {}
}: MessageListProps) {
  return (
    <div className={`max-h-[60vh] overflow-y-auto py-4 space-y-2 ${HOVER_TRANSITION}`}>
      {messages.map((message) => (
        <MessageItem 
          key={message.message_id}
          message={message}
          isSelected={selectedId === message.message_id}
          onSelect={setSelectedId}
          messageTitle={messageTitles[message.message_id] || "Emergency Message"}
          messageContent={messageContents[message.message_id]}
        />
      ))}
    </div>
  );
}
