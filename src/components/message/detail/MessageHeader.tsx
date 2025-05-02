
import { Button } from "@/components/ui/button";
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
    </div>
  );
}
