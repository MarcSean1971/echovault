
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
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
  handleArmMessage
}: MessageHeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between gap-4 mb-2 md:mb-0">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/messages")}
        size="sm"
        className="hover:bg-transparent p-0 md:p-2"
      >
        <ArrowLeft className="mr-1 h-5 w-5" />
        <span className="md:block">Back</span>
      </Button>
      
      {isMobile && (
        <div>
          {isArmed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisarmMessage}
              disabled={isActionLoading}
              className="text-green-600 border-green-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M6 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10M10 2h4a2 2 0 0 1 2 2v4H8V4a2 2 0 0 1 2-2Z"></path></svg>
              Disarm
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArmMessage}
              disabled={isActionLoading}
              className="text-destructive border-destructive"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M6 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10M10 2h4a2 2 0 0 1 2 2v4H8V4a2 2 0 0 1 2-2Z"></path></svg>
              Arm
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
