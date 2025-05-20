
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface DialogActionsProps {
  onClose: () => void;
  onSelect: () => void;
  isDisabled: boolean;
}

export function DialogActions({ onClose, onSelect, isDisabled }: DialogActionsProps) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button 
        variant="outline" 
        onClick={onClose} 
        className={HOVER_TRANSITION}
      >
        Cancel
      </Button>
      <Button 
        variant="destructive" 
        onClick={onSelect} 
        disabled={isDisabled}
        className={`${HOVER_TRANSITION} hover:bg-red-700 transition-colors`}
      >
        <AlertCircle className="h-4 w-4 mr-2" />
        Trigger Emergency
      </Button>
    </div>
  );
}
