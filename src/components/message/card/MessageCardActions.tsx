
import React from "react";
import { Button } from "@/components/ui/button";
import { BellOff, Bell, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="flex justify-between w-full">
      <div className="flex gap-2">
        {condition && (
          isArmed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onDisarmMessage}
              disabled={isLoading}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <BellOff className="h-4 w-4 mr-1" /> Disarm
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onArmMessage}
              disabled={isLoading}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
        className="hover:bg-secondary hover:text-secondary-foreground"
      >
        View <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
