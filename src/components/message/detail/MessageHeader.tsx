
import { Message } from "@/types/message";
import { getMessageIcon } from "@/utils/messageFormatUtils";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageHeaderProps {
  message: Message;
  isArmed: boolean;
  isActionLoading: boolean;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<Date | null>; // Changed return type to match the hook
}

export function MessageHeader({
  message,
  isArmed,
  isActionLoading,
  handleDisarmMessage,
  handleArmMessage,
}: MessageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Message Icon */}
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">
          {getMessageIcon(message.message_type)}
        </div>
        <div className="text-sm text-muted-foreground">
          {message.message_type === "text" ? "Text Message" : "Video Message"}
        </div>
      </div>
    </div>
  );
}
