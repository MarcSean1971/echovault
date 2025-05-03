
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface UnsupportedBrowserProps {
  onCancel: () => void;
}

export function UnsupportedBrowser({ onCancel }: UnsupportedBrowserProps) {
  return (
    <div className="p-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
      <p className="text-destructive mb-4 font-medium">
        Your browser doesn't support video recording.
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        Please try using Chrome, Firefox, or Edge for the best experience.
      </p>
      <Button 
        onClick={onCancel} 
        variant="outline"
        className={HOVER_TRANSITION}
      >
        Cancel
      </Button>
    </div>
  );
}
