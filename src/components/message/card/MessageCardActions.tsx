
import React from "react";
import { Button } from "@/components/ui/button";
import { BellOff, Bell, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMessageCardActions } from "@/hooks/useMessageCardActions";

interface MessageCardActionsProps {
  messageId: string;
  condition: any | null;
  isArmed: boolean;
  isLoading: boolean;
  onArmMessage: () => Promise<void>;
  onDisarmMessage: () => Promise<void>;
}

export function MessageCardActions({
  messageId,
  condition,
  isArmed,
  isLoading,
  onArmMessage,
  onDisarmMessage
}: MessageCardActionsProps) {
  const navigate = useNavigate();
  const { isLoading: isActionLoading } = useMessageCardActions();
  
  const buttonIsLoading = isLoading || isActionLoading;

  return (
    <div className="flex justify-between w-full">
      <div className="flex gap-2">
        {condition && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {isArmed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDisarmMessage}
                    disabled={buttonIsLoading}
                    className={`text-green-600 border-green-300 hover:border-green-500 hover:bg-green-50 hover:text-green-700 ${HOVER_TRANSITION}`}
                  >
                    <BellOff className="h-4 w-4 mr-1.5" /> 
                    <span className="hidden sm:inline">Disarm</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onArmMessage}
                    disabled={buttonIsLoading}
                    className={`text-destructive border-destructive/30 hover:border-destructive hover:bg-destructive/10 hover:text-destructive ${HOVER_TRANSITION}`}
                  >
                    <Bell className="h-4 w-4 mr-1.5" /> 
                    <span className="hidden sm:inline">Arm</span>
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent>
                {isArmed ? "Disarm this message" : "Arm this message"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/message/${messageId}`)}
              className={`hover:bg-primary/10 hover:text-primary ${HOVER_TRANSITION}`}
            >
              <span className="hidden sm:inline mr-1.5">View</span> 
              <ArrowRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            View message details
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
