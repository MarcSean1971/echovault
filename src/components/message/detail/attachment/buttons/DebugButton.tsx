
import React from "react";
import { Bug } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessButton } from "./AccessButton";

interface DebugButtonProps { 
  isLoading: boolean; 
  toggleDebug: () => void;
}

export const DebugButton: React.FC<DebugButtonProps> = ({ 
  isLoading, 
  toggleDebug 
}) => {
  return (
    <AccessButton
      variant="ghost"
      isLoading={isLoading}
      onClick={toggleDebug}
      icon={<Bug className={`h-4 w-4 ${HOVER_TRANSITION}`} />}
      tooltipText="Toggle debug info"
    />
  );
};
