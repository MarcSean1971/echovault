
import React from "react";
import { Button } from "@/components/ui/button";
import { BellOff, Bell, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHoverEffects } from "@/hooks/useHoverEffects";

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

  // Define a no-hover class that will override the hover color changes
  const noHoverClass = "hover:bg-transparent hover:text-inherit";

  return (
    <div className="flex justify-between">
      <div className="flex gap-2">
        {condition && (
          isArmed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onDisarmMessage}
              disabled={isLoading}
              className={`text-green-600 ${noHoverClass}`}
            >
              <BellOff className="h-4 w-4 mr-1" /> Disarm
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onArmMessage}
              disabled={isLoading}
              className={`text-destructive ${noHoverClass}`}
            >
              <Bell className="h-4 w-4 mr-1" /> Arm
            </Button>
          )
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/message/${messageId}`)}
        className={noHoverClass}
      >
        View <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
