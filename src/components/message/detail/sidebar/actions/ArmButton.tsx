
import { Shield, ShieldOff } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface ArmButtonProps {
  isArmed: boolean;
  isActionLoading: boolean;
  onArmMessage: () => Promise<Date | null>;
  onDisarmMessage: () => Promise<void>;
}

export function ArmButton({
  isArmed,
  isActionLoading,
  onArmMessage,
  onDisarmMessage
}: ArmButtonProps) {
  if (isArmed) {
    return (
      <ActionButton
        icon={ShieldOff}
        label="Disarm Message"
        onClick={onDisarmMessage}
        disabled={isActionLoading}
        variant="outline"
        iconClassName={`text-green-600 transition-all group-hover:scale-110 ${HOVER_TRANSITION}`}
        tooltipText={isActionLoading ? "Disarming in progress..." : undefined}
      />
    );
  }
  
  return (
    <ActionButton
      icon={Shield}
      label="Arm Message"
      onClick={onArmMessage}
      disabled={isActionLoading}
      variant="destructive"
      iconClassName={`transition-all group-hover:scale-110 ${HOVER_TRANSITION}`}
      tooltipText={isActionLoading ? "Arming in progress..." : undefined}
    />
  );
}
