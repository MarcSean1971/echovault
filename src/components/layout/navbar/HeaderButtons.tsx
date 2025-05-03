
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, MessageSquare } from "lucide-react";
import { MessageCondition } from "@/types/message";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderButtonsProps {
  conditions: MessageCondition[];
  userId: string | null;
}

export function HeaderButtons({ conditions, userId }: HeaderButtonsProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { handleCheckIn: handleDashboardCheckIn, isLoading: isChecking, nextDeadline } = useTriggerDashboard();
  
  // Urgency states for check-in button - default to false (orange button)
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVeryUrgent, setIsVeryUrgent] = useState(false);
  
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
  
  // Calculate urgency levels based on deadline
  useEffect(() => {
    if (!nextDeadline) {
      // If no deadline is set, ensure we remain in the default orange state
      setIsUrgent(false);
      setIsVeryUrgent(false);
      return;
    }
    
    const checkUrgency = () => {
      const now = new Date();
      const diff = nextDeadline.getTime() - now.getTime();
      const hoursRemaining = Math.max(0, diff / (1000 * 60 * 60));
      
      // Set urgency based on remaining time
      setIsVeryUrgent(hoursRemaining < 3); // Very urgent if less than 3 hours
      setIsUrgent(hoursRemaining < 12 && hoursRemaining >= 3); // Urgent if between 3-12 hours
    };
    
    // Check immediately and then set up interval
    checkUrgency();
    const interval = setInterval(checkUrgency, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [nextDeadline]);

  // Determine check-in button color based on urgency
  // Default is orange (bg-orange-500), then gradient, then red
  const getCheckInButtonStyle = () => {
    if (isVeryUrgent) {
      return "bg-red-600 text-white hover:bg-red-700";
    } else if (isUrgent) {
      return "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90";
    } else {
      return "bg-orange-500 text-white hover:bg-orange-600";
    }
  };

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

  // Determine button styles based on screen size
  const buttonSizeClass = isMobile ? "text-xs" : "";
  const buttonPaddingClass = isMobile ? "px-2 py-1" : "px-6 py-2";
  const iconSizeClass = isMobile ? "h-4 w-4" : "h-5 w-5";
  const containerClass = isMobile 
    ? "flex absolute left-1/2 transform -translate-x-1/2 translate-y-[2.5rem] z-20 space-x-2 justify-center" 
    : "hidden md:flex absolute left-1/2 transform -translate-x-1/2 z-20 space-x-4";

  return (
    <div className={containerClass}>
      {/* Messages button */}
      <Button 
        className={`bg-green-600 text-white hover:bg-green-700 hover:-translate-y-0.5 transition-all shadow-lg ${buttonPaddingClass} ${buttonSizeClass}`}
        size={isMobile ? "sm" : "lg"}
        asChild
      >
        <Link to="/messages">
          <span className="flex items-center gap-1 font-medium">
            <MessageSquare className={iconSizeClass} />
            Messages
          </span>
        </Link>
      </Button>
      
      {/* Check In Now button - only show when active check-in conditions exist */}
      {hasCheckInConditions && (
        <Button 
          onClick={handleDashboardCheckIn}
          disabled={isChecking || panicMode}
          className={`${getCheckInButtonStyle()} transition-all shadow-lg hover:-translate-y-0.5 ${buttonPaddingClass} ${buttonSizeClass}`}
          size={isMobile ? "sm" : "lg"}
        >
          <span className="flex items-center gap-1 font-medium">
            <Check className={iconSizeClass} />
            {!isMobile ? "Check In Now" : "Check In"}
          </span>
        </Button>
      )}
      
      {/* Emergency Panic Button - only shown when active panic message exists */}
      {panicMessage && (
        <Button 
          onClick={handlePanicTrigger}
          disabled={isChecking || panicMode || triggerInProgress}
          className={`bg-red-600 text-white transition-all shadow-lg hover:opacity-90 hover:-translate-y-0.5 ${buttonPaddingClass} ${buttonSizeClass}`}
          size={isMobile ? "sm" : "lg"}
        >
          <span className="flex items-center gap-1 font-medium">
            <AlertCircle className={iconSizeClass} />
            {panicMode 
              ? countDown > 0 
                ? `SENDING... ${!isMobile ? `(${countDown})` : ""}` 
                : "SENDING..." 
              : isConfirming 
                ? (isMobile ? "CONFIRM" : "CONFIRM EMERGENCY") 
                : (isMobile ? "Emergency" : "Emergency")
            }
          </span>
        </Button>
      )}
    </div>
  );
}
