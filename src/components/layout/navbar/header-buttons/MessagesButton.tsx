
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

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
      className={`bg-green-600 text-white hover:bg-green-700 hover:-translate-y-0.5 transition-all shadow-lg ${buttonPaddingClass} ${buttonSizeClass}`}
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
