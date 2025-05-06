
import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessButtonProps } from "../types";
import { Loader2 } from "lucide-react";

export const AccessButton: React.FC<AccessButtonProps> = ({ 
  isLoading, 
  onClick, 
  icon, 
  tooltipText, 
  variant = "outline",
  className = "",
  disabled = false
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={variant}
            size="sm" 
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`${HOVER_TRANSITION} relative ${className}`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              icon
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
