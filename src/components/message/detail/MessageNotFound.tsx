
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface MessageNotFoundProps {
  isInitialLoading?: boolean; // New prop to indicate initial loading state
}

export function MessageNotFound({ isInitialLoading = false }: MessageNotFoundProps) {
  const navigate = useNavigate();

  // Don't show the "not found" message during initial loading
  if (isInitialLoading) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Message not found</h1>
        <Button 
          onClick={() => navigate("/messages")}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
        >
          Back to Messages
        </Button>
      </div>
    </div>
  );
}
