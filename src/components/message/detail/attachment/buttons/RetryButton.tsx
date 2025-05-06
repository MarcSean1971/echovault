
import React from "react";
import { RefreshCw } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessButton } from "./AccessButton";

interface RetryButtonProps { 
  isLoading: boolean; 
  retryAccess: () => void;
}

export const RetryButton: React.FC<RetryButtonProps> = ({ 
  isLoading, 
  retryAccess 
}) => {
  return (
    <AccessButton
      variant="outline"
      isLoading={isLoading}
      onClick={retryAccess}
      icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} ${HOVER_TRANSITION}`} />}
      tooltipText="Retry access"
      className="hover:bg-amber-100"
    />
  );
};
