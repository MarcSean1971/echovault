
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface CheckInButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isMobile: boolean;
  buttonPaddingClass: string;
  buttonSizeClass: string;
  iconSizeClass: string;
}

export function CheckInButton({ 
  onClick, 
  isDisabled, 
  isMobile, 
  buttonPaddingClass, 
  buttonSizeClass,
  iconSizeClass 
}: CheckInButtonProps) {
  return (
    <Button 
      onClick={onClick}
      disabled={isDisabled}
      className={`bg-orange-500 text-white ${buttonPaddingClass} ${buttonSizeClass} ${HOVER_TRANSITION}`}
      size={isMobile ? "sm" : "lg"}
      style={{ backgroundColor: "#f97316" }} 
    >
      <span className="flex items-center gap-1 font-medium">
        <Check className={iconSizeClass} />
        {!isMobile ? "Check In Now" : "Check In"}
      </span>
    </Button>
  );
}
