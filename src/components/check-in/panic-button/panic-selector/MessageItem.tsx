
import { MessageCondition } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageItemProps {
  message: MessageCondition;
  isSelected: boolean;
  onSelect: (messageId: string) => void;
  messageTitle?: string;
  messageContent?: string;
}

export function MessageItem({ 
  message, 
  isSelected, 
  onSelect,
  messageTitle = "Emergency Message",
  messageContent
}: MessageItemProps) {
  // Calculate recipient count from the condition directly
  const recipientCount = message.recipients?.length || 0;

  return (
    <div 
      className={`p-4 border rounded-md cursor-pointer transition-all ${
        isSelected 
          ? "border-red-500 bg-red-50" 
          : "border-gray-200 hover:border-red-200"
      } ${HOVER_TRANSITION}`}
      onClick={() => onSelect(message.message_id)}
    >
      <div className="font-medium">{messageTitle}</div>
      
      {messageContent && (
        <div className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">
          {messageContent}
        </div>
      )}
      
      {/* Display recipient count which we already have */}
      <div className="text-xs text-gray-400 mt-1">
        Recipients: {recipientCount}
      </div>
    </div>
  );
}
