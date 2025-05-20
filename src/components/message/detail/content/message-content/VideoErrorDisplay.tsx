
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface VideoErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export function VideoErrorDisplay({ error, onRetry }: VideoErrorDisplayProps) {
  return (
    <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white ${HOVER_TRANSITION}`}>
      <p className="mb-3 text-center px-4">{error}</p>
      <Button 
        variant="outline" 
        size="sm"
        className="bg-white/20 text-white hover:bg-white/30"
        onClick={onRetry}
      >
        <RefreshCw className="h-4 w-4 mr-2" /> Try Again
      </Button>
    </div>
  );
}
