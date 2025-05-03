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
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0); // Added for local tracking
  const [locationPermission, setLocationPermission] = useState<string>("unknown");
  
  // Get the lastRefresh value to trigger re-renders when conditions change
  const { handleCheckIn: handleDashboardCheckIn, isLoading: isChecking, nextDeadline, lastRefresh, refreshConditions } = useTriggerDashboard();
  
  // Check location permissions
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          setLocationPermission(result.state);
          
          // Listen for permission changes
          result.onchange = () => {
            setLocationPermission(result.state);
          };
        })
        .catch(err => {
          console.error("Error checking location permissions:", err);
          setLocationPermission("denied");
        });
    }
  }, []);
  
  // Force refresh conditions when component mounts and when lastRefresh changes
  useEffect(() => {
    if (userId) {
      console.log("HeaderButtons refreshing conditions");
      refreshConditions();
    }
  }, [userId, lastRefresh, refreshConditions]);
  
  // Find panic message from conditions
  const panicMessage = conditions.find(c => 
    c.condition_type === 'panic_trigger' && c.active === true
  ) || null;

  // Find check-in related conditions - only count active conditions
  const hasCheckInConditions = conditions.some(c => 
    (c.condition_type === 'no_check_in' || c.condition_type === 'regular_check_in') && 
    c.active === true
  );
  
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

  // Modified check-in handler to also dispatch the event directly
  const handleCheckIn = async () => {
    try {
      // Explicitly ensure we get a boolean result from handleDashboardCheckIn
      const success = await handleDashboardCheckIn();
      
      // Only proceed if success is explicitly true
      if (success === true) {
        // Increment local trigger for immediate UI update
        setLocalRefreshTrigger(prev => prev + 1);
        
        // Dispatch event with current timestamp for global updates
        console.log("Dispatching conditions-updated event from HeaderButtons");
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { 
            updatedAt: new Date().toISOString(),
            triggerValue: Date.now() // Add unique value to ensure it's always different
          }
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error during check-in:", error);
      return false;
    }
  };

  // Request location permission
  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission("granted");
          handlePanicTrigger();
        },
        (error) => {
          console.error("Location permission denied:", error);
          setLocationPermission("denied");
          toast({
            title: "Location Access Denied",
            description: "Your current location won't be included in the emergency message",
            variant: "warning"
          });
          // Continue with panic trigger even without location
          handlePanicTrigger();
        }
      );
    } else {
      toast({
        title: "Location Not Available",
        description: "Your device doesn't support location services",
        variant: "warning"
      });
      // Continue with panic trigger even without location
      handlePanicTrigger();
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
            description: "Your emergency messages with your current location are being sent immediately.",
            variant: "destructive"
          });
          
          // Start countdown for visual feedback
          let secondsLeft = 3;
          setCountDown(secondsLeft);
          
          // Dispatch event with panic message ID so message cards can show countdown
          window.dispatchEvent(new CustomEvent('conditions-updated', { 
            detail: { 
              updatedAt: new Date().toISOString(),
              triggerValue: Date.now(),
              panicTrigger: true,
              panicMessageId: panicMessage.message_id
            }
          }));
          
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
                // Refresh conditions instead of reloading the page
                refreshConditions();
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

  // Handle panic button click with location permission check
  const handlePanicButtonClick = () => {
    if (isConfirming) {
      // If already confirming, check/request location permission
      if (locationPermission === "granted") {
        handlePanicTrigger();
      } else {
        requestLocationPermission();
      }
    } else {
      // Just show confirmation first time
      setIsConfirming(true);
      
      // Auto-reset confirmation state if not clicked again
      setTimeout(() => {
        if (isConfirming) {
          setIsConfirming(false);
        }
      }, 3000);
    }
  };

  // Determine button styles based on screen size
  const buttonSizeClass = isMobile ? "text-xs" : "";
  const buttonPaddingClass = isMobile ? "px-2 py-1" : "px-6 py-2";
  const iconSizeClass = isMobile ? "h-4 w-4" : "h-5 w-5";
  
  // Updated container class to always be visible on both mobile and desktop
  const containerClass = isMobile 
    ? "flex justify-center space-x-2 mt-0" 
    : "flex justify-center space-x-4"; // Removed "hidden md:flex" to make it visible

  return (
    <div className={containerClass}>
      {/* Messages button - always visible */}
      <MessagesButton
        buttonPaddingClass={buttonPaddingClass}
        buttonSizeClass={buttonSizeClass}
        iconSizeClass={iconSizeClass}
        isMobile={isMobile}
      />
      
      {/* Check In Now button - only show when active check-in conditions exist */}
      {hasCheckInConditions && (
        <CheckInButton
          onClick={handleCheckIn}
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
          onClick={handlePanicButtonClick}
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
