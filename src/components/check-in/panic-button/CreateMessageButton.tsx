
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface CreateMessageButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function CreateMessageButton({ onClick, disabled }: CreateMessageButtonProps) {
  return (
    <Button 
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={`w-full ${HOVER_TRANSITION}`}
    >
      Create Emergency Message
    </Button>
  );
}
