
import { Button } from "@/components/ui/button";
import { AlertCircle, MapPin } from "lucide-react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS, CONFIRMATION_ANIMATION } from "@/utils/hoverEffects";

interface PanicButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isMobile: boolean;
  buttonPaddingClass: string;
  buttonSizeClass: string;
  iconSizeClass: string;
  panicMode: boolean;
  countDown: number;
  isConfirming: boolean;
}

export function PanicButton({ 
  onClick, 
  isDisabled, 
  isMobile, 
  buttonPaddingClass, 
  buttonSizeClass, 
  iconSizeClass,
  panicMode,
  countDown,
  isConfirming
}: PanicButtonProps) {
  return (
    <Button 
      onClick={onClick}
      disabled={isDisabled}
      className={`bg-red-600 text-white ${buttonPaddingClass} ${buttonSizeClass} hover:bg-red-700 
        ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.destructive}
        ${isConfirming ? CONFIRMATION_ANIMATION.pulse : ""}`}
      size={isMobile ? "sm" : "lg"}
      style={{ backgroundColor: "#dc2626" }}
    >
      <span className="flex items-center gap-1 font-medium">
        {panicMode ? (
          <>
            <AlertCircle className={iconSizeClass} />
            {countDown > 0 ? `SENDING... (${countDown})` : "SENDING..."}
          </>
        ) : isConfirming ? (
          <>
            <AlertCircle className={`${iconSizeClass} animate-pulse`} />
            {isMobile ? "CONFIRM" : "CONFIRM EMERGENCY"}
          </>
        ) : (
          <>
            <AlertCircle className={iconSizeClass} />
            {isMobile ? "Emergency" : "Emergency"}
            <MapPin className={`${iconSizeClass} ml-1`} />
          </>
        )}
      </span>
    </Button>
  );
}
