
import React from "react";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface VideoRecorderFooterProps {
  onCancel: () => void;
}

export function VideoRecorderFooter({ onCancel }: VideoRecorderFooterProps) {
  return (
    <div className="mt-4 flex justify-end">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onCancel}
        className={HOVER_TRANSITION}
      >
        Cancel
      </Button>
    </div>
  );
}
