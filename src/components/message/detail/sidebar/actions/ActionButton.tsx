
import React from "react";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  tooltipText?: string;
  iconClassName?: string;
  className?: string; // Added className prop to the interface
}

export function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  variant = "outline",
  tooltipText,
  iconClassName = "",
  className = "" // Added default value for className
}: ActionButtonProps) {
  const iconHoverEffect = "transition-transform group-hover:scale-110";
  
  const button = (
    <Button
      variant={variant}
      className={`w-full group ${HOVER_TRANSITION} ${className}`} // Added className to Button
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className={`h-4 w-4 mr-2 ${iconHoverEffect} ${iconClassName}`} />
      {label}
    </Button>
  );
  
  if (tooltipText && disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{button}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return button;
}
