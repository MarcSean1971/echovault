
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

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
      className={`w-full ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
    >
      Create Emergency Message
    </Button>
  );
}
