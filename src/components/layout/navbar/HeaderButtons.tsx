import { Button } from "@/components/ui/button";
import { Check, AlertCircle } from "lucide-react";
import { MessageCondition } from "@/types/message";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface HeaderButtonsProps {
  conditions: MessageCondition[];
  userId: string | null;
  isChecking: boolean;
  onCheckIn: () => Promise<void>;
}

export function HeaderButtons({ conditions, userId, isChecking, onCheckIn }: HeaderButtonsProps) {
  const navigate = useNavigate();
  
  // Panic button states
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [triggerInProgress, setTriggerInProgress] = useState(false);

  // Find panic message from conditions
  const panicMessage = conditions.find(c => 
    c.condition_type === 'panic_trigger' && c.active === true
  ) || null;

  // Find check-in related conditions
  const hasCheckInConditions = conditions.some(c => 
    (c.condition_type === 'no_check_in' || c.condition_type === 'regular_check_in') && 
    c.active === true
  );

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
        // Trigger the panic message
        const result = await triggerPanicMessage(userId, panicMessage.message_id);
        
        if (result.success) {
          toast({
            title: "EMERGENCY ALERT TRIGGERED",
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
              
              // If the message is still armed (keepArmed=true), refresh to show it's still active
              // Otherwise navigate to messages
              if (result.keepArmed) {
                toast({
                  title: "Emergency message still armed",
                  description: "Your emergency message remains active and can be triggered again if needed."
                });
                window.location.reload();
              } else {
                navigate('/messages');
              }
            }
          }, 1000);
        }
      } catch (error: any) {
        console.error("Error triggering panic message:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to trigger panic message. Please try again.",
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

  if (!hasCheckInConditions && !panicMessage) {
    return null;
  }

  return (
    <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 z-20 space-x-4">
      {/* Check In Now button - only show when active check-in conditions exist */}
      {hasCheckInConditions && (
        <Button 
          onClick={onCheckIn}
          disabled={isChecking || panicMode}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg px-6 py-2 text-white"
          size="lg"
        >
          <span className="flex items-center gap-2 font-medium">
            <Check className="h-5 w-5" />
            {isChecking ? "Checking In..." : "Check In Now"}
          </span>
        </Button>
      )}
      
      {/* Emergency Panic Button - only shown when active panic message exists */}
      {panicMessage && (
        <Button 
          onClick={handlePanicTrigger}
          disabled={isChecking || panicMode || triggerInProgress}
          variant={isConfirming ? "destructive" : "outline"}
          className={`transition-all shadow-lg hover:opacity-90 px-6 py-2 ${
            isConfirming ? 
              "bg-gradient-to-r from-red-600 to-red-500 text-white" : 
              "border-red-500 text-red-500 hover:bg-red-50"
          }`}
          size="lg"
        >
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-5 w-5" />
            {panicMode 
              ? countDown > 0 
                ? `SENDING... (${countDown})` 
                : "SENDING..." 
              : isConfirming 
                ? "CONFIRM EMERGENCY" 
                : "Emergency"
            }
          </span>
        </Button>
      )}
    </div>
  );
}
