
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Message } from "@/types/message";
import { getMessageIcon } from "@/utils/messageFormatUtils";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageHeaderProps {
  message: Message;
  isArmed: boolean;
  isActionLoading: boolean;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<Date | null>; // Changed return type to match the hook
}

export function MessageHeader({
  message,
  isArmed,
  isActionLoading,
  handleDisarmMessage,
  handleArmMessage,
}: MessageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/messages")}
            className="rounded-full hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className={`h-5 w-5 ${HOVER_TRANSITION}`} />
          </Button>
          <h1 className="text-xl font-medium md:text-2xl">Message Details</h1>
        </div>
        
        {/* Arm/Disarm Button - ONLY SHOWN HERE */}
        <div>
          {isArmed ? (
            <Button
              variant="outline"
              onClick={handleDisarmMessage}
              disabled={isActionLoading}
              className="text-green-600 hover:bg-green-50 hover:text-green-700"
              size="sm"
            >
              <BellOff className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Disarm
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleArmMessage}
              disabled={isActionLoading}
              className="text-destructive hover:bg-destructive/10"
              size="sm"
            >
              <Bell className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Arm
            </Button>
          )}
        </div>
      </div>
      
      {/* Message Title with Icon */}
      <div className="flex items-start gap-3 pl-9">
        <div className="mt-1 text-muted-foreground">
          {getMessageIcon(message.message_type)}
        </div>
        <h2 className="text-2xl font-semibold leading-tight break-words">
          {message.title}
        </h2>
      </div>
    </div>
  );
}
