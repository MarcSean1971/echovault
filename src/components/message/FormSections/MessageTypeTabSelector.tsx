
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

// Simple component that only shows Text option
export function MessageTypeTabSelector() {
  return (
    <div className="flex space-x-2 mb-4 border-b">
      <Button
        type="button"
        variant="default"
        className={`rounded-none rounded-t-lg ${HOVER_TRANSITION}`}
      >
        <FileText className="h-4 w-4 mr-2" />
        Text
      </Button>
    </div>
  );
}
