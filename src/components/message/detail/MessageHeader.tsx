
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Message } from "@/types/message";
import { getMessageIcon } from "@/utils/messageFormatUtils";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { StatusBadge } from "@/components/ui/status-badge";

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
        <Button 
          variant="ghost" 
          onClick={() => navigate("/messages")}
          className={`mb-0 hover:bg-muted/80 hover:text-foreground ${HOVER_TRANSITION}`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Messages
        </Button>
        
        {/* Arm/Disarm Button with Status Badge */}
        <div className="flex items-center gap-2">
          <StatusBadge status={isArmed ? "armed" : "disarmed"} size="default">
            {isArmed ? "Armed" : "Disarmed"}
          </StatusBadge>
          
          {isArmed ? (
            <Button
              variant="outline"
              onClick={handleDisarmMessage}
              disabled={isActionLoading}
              className="text-green-600 hover:bg-green-100 hover:text-green-700"
              size="sm"
            >
              <BellOff className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Disarm
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleArmMessage}
              disabled={isActionLoading}
              className="text-destructive hover:bg-destructive/20 hover:text-destructive border-destructive"
              size="sm"
            >
              <Bell className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Arm
            </Button>
          )}
        </div>
      </div>
      
      {/* Message Title with Icon */}
      <div className="flex items-start gap-3">
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
