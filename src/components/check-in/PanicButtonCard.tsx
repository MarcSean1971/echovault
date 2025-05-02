
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { triggerPanicMessage, hasActivePanicMessages } from "@/services/messages/conditions/panicTriggerService";
import { MessageCondition } from "@/types/message";
import { useNavigate } from "react-router-dom";

interface PanicButtonCardProps {
  userId: string | undefined;
  panicMessage: MessageCondition | null;
  isChecking: boolean;
  isLoading: boolean;
}

export function PanicButtonCard({ userId, panicMessage, isChecking, isLoading }: PanicButtonCardProps) {
  const navigate = useNavigate();
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [triggerInProgress, setTriggerInProgress] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [hasPanicMessages, setHasPanicMessages] = useState(false);

  // Check if user has any panic messages on mount
  useEffect(() => {
    const checkPanicMessages = async () => {
      if (!userId) return;
      
      try {
        const hasMessages = await hasActivePanicMessages(userId);
        setHasPanicMessages(hasMessages);
      } catch (error) {
        console.error("Error checking panic messages:", error);
      }
    };
    
    if (!panicMessage && !isLoading && userId) {
      checkPanicMessages();
    }
  }, [userId, panicMessage, isLoading]);

  // Handle panic trigger
  const handlePanicTrigger = async () => {
    if (!userId || !panicMessage) {
      toast({
        title: "Error",
        description: "No panic message is configured",
        variant: "destructive"
      });
      return;
    }

    if (isConfirming) {
      setTriggerInProgress(true);
      setPanicMode(true);
      
      try {
        const result = await triggerPanicMessage(userId, panicMessage.message_id);
        if (result.success) {
          toast({
            title: "PANIC MODE ACTIVATED",
            description: "Your emergency messages are being sent immediately.",
            variant: "destructive"
          });
          
          // Start countdown for visual feedback
          let secondsLeft = 3;
          setCountDown(secondsLeft);
          
          const timer = setInterval(() => {
            secondsLeft -= 1;
            setCountDown(secondsLeft);
            
            if (secondsLeft <= 0) {
              clearInterval(timer);
              setPanicMode(false);
              setIsConfirming(false);
              setTriggerInProgress(false);
              navigate('/messages'); // Redirect to messages page
            }
          }, 1000);
        }
      } catch (error: any) {
        console.error("Error triggering panic message:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to trigger panic message",
          variant: "destructive"
        });
        setPanicMode(false);
        setIsConfirming(false);
        setTriggerInProgress(false);
      }
    } else {
      setIsConfirming(true);
      
      // Auto-reset confirmation state if not clicked again
      setTimeout(() => {
        if (isConfirming) {
          setIsConfirming(false);
        }
      }, 3000);
    }
  };

  // Create new panic message
  const handleCreatePanicMessage = () => {
    navigate('/create-message');
  };

  return (
    <Card className={panicMode ? "border-red-500" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center text-red-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          Emergency Panic Button
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Press this button in emergency situations to immediately trigger your 
          configured emergency messages.
        </p>
        
        {panicMessage ? (
          <Button 
            variant={isConfirming ? "destructive" : "outline"}
            onClick={handlePanicTrigger}
            disabled={isChecking || panicMode || isLoading || triggerInProgress}
            className="w-full"
          >
            {panicMode 
              ? countDown > 0 
                ? `MESSAGES SENDING... (${countDown})` 
                : "MESSAGES SENDING..." 
              : isConfirming 
                ? "CONFIRM EMERGENCY TRIGGER" 
                : "Emergency Panic Button"
            }
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={handleCreatePanicMessage}
            disabled={isLoading}
            className="w-full"
          >
            Create Emergency Message
          </Button>
        )}
        
        {isConfirming && (
          <p className="text-red-500 text-sm animate-pulse">
            Click again to confirm emergency trigger
          </p>
        )}
        
        {!panicMessage && !isLoading && !hasPanicMessages && (
          <p className="text-amber-500 text-sm">
            No panic trigger messages configured. Create one to use this feature.
          </p>
        )}
        
        {!panicMessage && hasPanicMessages && !isLoading && (
          <p className="text-amber-500 text-sm">
            You have panic messages, but they're not appearing here. Try checking your message settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
