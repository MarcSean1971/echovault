
import { Mail } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface TestMessageButtonProps {
  onSendTestMessage: () => void;
  isArmed: boolean;
  isActionLoading: boolean;
}

export function TestMessageButton({
  onSendTestMessage,
  isArmed,
  isActionLoading
}: TestMessageButtonProps) {
  return (
    <ActionButton
      icon={Mail}
      label="Send Test Message"
      onClick={onSendTestMessage}
      disabled={isArmed || isActionLoading}
      tooltipText={isArmed ? "Disarm the message first to send a test" : undefined}
      className={HOVER_TRANSITION}
    />
  );
}
