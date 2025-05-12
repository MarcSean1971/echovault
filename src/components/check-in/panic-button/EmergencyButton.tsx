
import { Button } from "@/components/ui/button";
import { AlertCircle, MapPin, X } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface EmergencyButtonProps {
  isPanicMode: boolean;
  isConfirming: boolean;
  countDown: number;
  onClick: () => void;
  disabled: boolean;
  inCancelWindow?: boolean;
}

export function EmergencyButton({
  isPanicMode,
  isConfirming,
  countDown,
  onClick,
  disabled,
  inCancelWindow = false
}: EmergencyButtonProps) {
  return (
    <Button 
      variant={inCancelWindow ? "destructive" : "outline"}
      onClick={onClick}
      disabled={disabled}
      className={`w-full ${HOVER_TRANSITION} ${
        inCancelWindow ? 'animate-pulse' : ''
      }`}
    >
      {inCancelWindow 
        ? (
          <span className="flex items-center gap-2">
            <X className="h-4 w-4 animate-pulse" />
            CLICK TO CANCEL ({countDown}s)
            <X className="h-4 w-4 animate-pulse" />
          </span>
        )
        : isPanicMode 
          ? countDown > 0 
            ? `MESSAGES SENDING... (${countDown})` 
            : "MESSAGES SENDING..." 
          : (
            <span className="flex items-center">
              <span>Emergency Panic Button</span>
              <MapPin className="h-4 w-4 ml-2" />
            </span>
          )
      }
    </Button>
  );
}
