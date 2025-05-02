
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Message } from "@/types/message";

interface MessageHeaderProps {
  message: Message;
  isArmed: boolean;
  isActionLoading: boolean;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<void>;
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/messages")}
          className="rounded-full hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-medium md:text-2xl">Message Details</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <StatusBadge status={isArmed ? "armed" : "disarmed"}>
          {isArmed ? "Armed" : "Disarmed"}
        </StatusBadge>
        
        <div className="hidden md:block">
          {isArmed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisarmMessage}
              disabled={isActionLoading}
              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-700"
            >
              Disarm
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArmMessage}
              disabled={isActionLoading}
              className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/80"
            >
              Arm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
