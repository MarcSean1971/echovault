
import React from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessButton } from "./AccessButton";

interface OpenButtonProps { 
  isLoading: boolean; 
  hasError: boolean;
  onClick: () => void;
}

export const OpenButton: React.FC<OpenButtonProps> = ({ 
  isLoading, 
  hasError, 
  onClick 
}) => {
  return (
    <AccessButton
      variant="ghost"
      isLoading={isLoading}
      onClick={onClick}
      icon={hasError ? (
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} ${HOVER_TRANSITION}`} />
      ) : (
        <ExternalLink className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''} ${HOVER_TRANSITION}`} />
      )}
      tooltipText={hasError ? 'Retry access' : 'Open in new tab'}
      className="hover:bg-gray-100"
    />
  );
};
