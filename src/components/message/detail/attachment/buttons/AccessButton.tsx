
import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { AccessButtonProps } from "../types";

export const AccessButton: React.FC<AccessButtonProps> = ({ 
  isLoading, 
  onClick, 
  icon, 
  tooltipText, 
  variant = "outline",
  className = ""
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={variant}
            size="sm" 
            onClick={onClick}
            disabled={isLoading}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} ${className}`}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
