
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface PermissionRetryButtonProps {
  onRetry: () => void;
}

export function PermissionRetryButton({ onRetry }: PermissionRetryButtonProps) {
  return (
    <div className="flex justify-center w-full">
      <Button 
        onClick={onRetry} 
        variant="outline"
        className={`flex items-center gap-2 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
      >
        <RefreshCw className="w-4 h-4" /> Try Again
      </Button>
    </div>
  );
}
