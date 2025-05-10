
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function MessageTypeSelector() {
  return (
    <div className="flex space-x-2 mb-4">
      <Button
        type="button"
        variant="default"
        className={`${HOVER_TRANSITION}`}
      >
        <FileText className="h-4 w-4 mr-2" />
        Text
      </Button>
    </div>
  );
}
