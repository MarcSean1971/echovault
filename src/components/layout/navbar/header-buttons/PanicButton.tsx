
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

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
      className={`bg-red-600 text-white transition-all shadow-lg hover:bg-red-700 hover:-translate-y-0.5 ${buttonPaddingClass} ${buttonSizeClass}`}
      size={isMobile ? "sm" : "lg"}
      style={{ backgroundColor: "#dc2626" }}
    >
      <span className="flex items-center gap-1 font-medium">
        <AlertCircle className={iconSizeClass} />
        {panicMode 
          ? countDown > 0 
            ? `SENDING... ${!isMobile ? `(${countDown})` : ""}` 
            : "SENDING..." 
          : isConfirming 
            ? (isMobile ? "CONFIRM" : "CONFIRM EMERGENCY") 
            : (isMobile ? "Emergency" : "Emergency")
        }
      </span>
    </Button>
  );
}
