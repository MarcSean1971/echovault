
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

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
      className={`bg-orange-500 hover:bg-orange-600 text-white ${buttonPaddingClass} ${buttonSizeClass} transition-all duration-200`}
      size={isMobile ? "sm" : "lg"}
      style={{ backgroundColor: "#f97316" }} 
    >
      <span className="flex items-center gap-1 font-medium">
        <Check className={`${iconSizeClass} transition-transform group-hover:scale-110`} />
        {!isMobile ? "Check In Now" : "Check In"}
      </span>
    </Button>
  );
}
