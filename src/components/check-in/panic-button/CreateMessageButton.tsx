
import { Button } from "@/components/ui/button";

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
      className="w-full"
    >
      Create Emergency Message
    </Button>
  );
}
