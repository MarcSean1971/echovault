
import { Message } from "@/types/message";

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
  // Return null instead of an empty div with spacing
  return null;
}
