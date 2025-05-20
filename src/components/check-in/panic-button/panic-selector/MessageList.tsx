
import { MessageCondition } from "@/types/message";
import { MessageItem } from "./MessageItem";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageListProps {
  messages: MessageCondition[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
}

export function MessageList({ 
  messages,
  selectedId,
  setSelectedId,
}: MessageListProps) {
  // No loading state anymore - we show content immediately
  return (
    <div className={`max-h-[60vh] overflow-y-auto py-4 space-y-2 ${HOVER_TRANSITION}`}>
      {messages.map((message) => (
        <MessageItem 
          key={message.message_id}
          message={message}
          isSelected={selectedId === message.message_id}
          onSelect={setSelectedId}
        />
      ))}
    </div>
  );
}
