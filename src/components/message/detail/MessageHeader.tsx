
import { Message } from "@/types/message";
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
      {/* Empty space where message type icon used to be */}
    </div>
  );
}
