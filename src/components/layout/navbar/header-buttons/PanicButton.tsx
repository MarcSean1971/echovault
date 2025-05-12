
import { Button } from "@/components/ui/button";
import { AlertCircle, MapPin, X } from "lucide-react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

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
  const inCancelWindow = panicMode && countDown > 0;
  
  return (
    <Button 
      onClick={onClick}
      disabled={isDisabled}
      className={`bg-red-600 text-white ${buttonPaddingClass} ${buttonSizeClass} hover:bg-red-700 
        ${HOVER_TRANSITION} 
        ${inCancelWindow ? "animate-pulse" : ""}`}
      size={isMobile ? "sm" : "lg"}
      style={{ backgroundColor: "#dc2626" }}
    >
      <span className="flex items-center gap-1 font-medium">
        {panicMode && countDown > 0 ? (
          <>
            <X className={`${iconSizeClass} animate-pulse`} />
            {isMobile ? `CANCEL (${countDown})` : `CLICK TO CANCEL (${countDown})`}
          </>
        ) : panicMode ? (
          <>
            <AlertCircle className={iconSizeClass} />
            {isMobile ? "SENDING..." : "MESSAGES SENDING..."}
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
