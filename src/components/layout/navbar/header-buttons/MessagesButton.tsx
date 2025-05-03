
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessagesButtonProps {
  buttonPaddingClass: string;
  buttonSizeClass: string;
  iconSizeClass: string;
  isMobile: boolean;
}

export function MessagesButton({
  buttonPaddingClass,
  buttonSizeClass,
  iconSizeClass,
  isMobile
}: MessagesButtonProps) {
  return (
    <Button 
      className={`bg-green-600 text-white ${buttonPaddingClass} ${buttonSizeClass} ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
      size={isMobile ? "sm" : "lg"}
      asChild
    >
      <Link to="/messages">
        <span className="flex items-center gap-1 font-medium">
          <MessageSquare className={iconSizeClass} />
          Messages
        </span>
      </Link>
    </Button>
  );
}
