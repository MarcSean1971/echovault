import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { toast } from "@/components/ui/use-toast";
import { MessageCondition } from "@/types/message";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessagesButton } from "./MessagesButton";
import { CheckInButton } from "./CheckInButton";
import { PanicButton } from "./PanicButton";
import { useTriggerDashboard } from "@/hooks/useTriggerDashboard";

interface HeaderButtonsProps {
  conditions: MessageCondition[];
  userId: string | null;
}

export function HeaderButtons({ conditions, userId }: HeaderButtonsProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // States from original component
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [triggerInProgress, setTriggerInProgress] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isVeryUrgent, setIsVeryUrgent] = useState(false);
  
  // Find panic message from conditions
  const panicMessage = conditions.find(c => 
    c.condition_type === 'panic_trigger' && c.active === true
  ) || null;

  // Find check-in related conditions
  const hasCheckInConditions = conditions.some(c => 
    (c.condition_type === 'no_check_in' || c.condition_type === 'regular_check_in') && 
    c.active === true
  );
  
  // Handle check-in logic
  const { handleCheckIn: handleDashboardCheckIn, isLoading: isChecking, nextDeadline } = useTriggerDashboard();
  
  // Keep the deadline effect as it updates state used by other components
  useEffect(() => {
    if (!nextDeadline) {
      setIsUrgent(false);
      setIsVeryUrgent(false);
      return;
    }
    
    const checkUrgency = () => {
      const now = new Date();
      const diff = nextDeadline.getTime() - now.getTime();
      const hoursRemaining = Math.max(0, diff / (1000 * 60 * 60));
      
      setIsVeryUrgent(hoursRemaining < 3); 
      setIsUrgent(hoursRemaining < 12 && hoursRemaining >= 3);
    };
    
    checkUrgency();
    const interval = setInterval(checkUrgency, 60000);
    
    return () => clearInterval(interval);
  }, [nextDeadline]);

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
      <MessagesButton
        buttonPaddingClass={buttonPaddingClass}
        buttonSizeClass={buttonSizeClass}
        iconSizeClass={iconSizeClass}
        isMobile={isMobile}
      />
      
      {/* Check In Now button - only show when active check-in conditions exist */}
      {hasCheckInConditions && (
        <CheckInButton
          onClick={handleDashboardCheckIn}
          isDisabled={isChecking || panicMode}
          isMobile={isMobile}
          buttonPaddingClass={buttonPaddingClass}
          buttonSizeClass={buttonSizeClass}
          iconSizeClass={iconSizeClass}
        />
      )}
      
      {/* Emergency Panic Button - only shown when active panic message exists */}
      {panicMessage && (
        <PanicButton
          onClick={handlePanicTrigger}
          isDisabled={isChecking || panicMode || triggerInProgress}
          isMobile={isMobile}
          buttonPaddingClass={buttonPaddingClass}
          buttonSizeClass={buttonSizeClass}
          iconSizeClass={iconSizeClass}
          panicMode={panicMode}
          countDown={countDown}
          isConfirming={isConfirming}
        />
      )}
    </div>
  );
}
