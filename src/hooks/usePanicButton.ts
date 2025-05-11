import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { MessageCondition } from "@/types/message";
import { checkLocationPermission, requestLocationPermission } from "./panic-button/locationUtils";
import { getCancelWindowSeconds, getKeepArmedValue } from "./panic-button/messageConfigUtils";
import { triggerPanicMessageWithCallbacks } from "./panic-button/triggerUtils";
import { startCountdown } from "./panic-button/countdownUtils";

/**
 * Hook to handle panic button functionality
 */
export function usePanicButton(
  userId: string | null | undefined, 
  panicMessage: MessageCondition | null,
  panicMessages: MessageCondition[] = []
) {
  const navigate = useNavigate();
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [triggerInProgress, setTriggerInProgress] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [locationPermission, setLocationPermission] = useState<string>("unknown");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [inCancelWindow, setInCancelWindow] = useState(false);
  const [cancelWindowTimer, setCancelWindowTimer] = useState<NodeJS.Timeout | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timer | null>(null);

  // Check location permissions
  useEffect(() => {
    const checkPermission = async () => {
      const permission = await checkLocationPermission();
      setLocationPermission(permission);
    };
    
    checkPermission();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cancelWindowTimer) {
        clearTimeout(cancelWindowTimer);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [cancelWindowTimer, countdownInterval]);

  // Start the cancellation countdown
  const startCancellationCountdown = () => {
    // Get the message to use
    const messageToUse = selectedMessageId 
      ? panicMessages.find(m => m.message_id === selectedMessageId)
      : (panicMessage || (panicMessages.length > 0 ? panicMessages[0] : null));
    
    if (!messageToUse || !userId) {
      toast({
        title: "Error",
        description: "No panic message is configured or user is not logged in",
        variant: "destructive"
      });
      return;
    }

    // Set UI state to show cancellation window
    setInCancelWindow(true);
    setPanicMode(true);
    setTriggerInProgress(true);
    
    // Get cancellation window duration
    const cancelWindowSecs = getCancelWindowSeconds(selectedMessageId, panicMessages, panicMessage);
    console.log(`Cancel window seconds: ${cancelWindowSecs}`);
    
    // Show toast with cancellation option
    toast({
      title: "EMERGENCY ALERT PENDING",
      description: `Your emergency message will be sent in ${cancelWindowSecs} seconds. Click the button again to cancel.`,
      variant: "destructive",
    });
    
    // Setup countdown
    const countdown = startCountdown(
      cancelWindowSecs,
      (secondsLeft) => {
        setCountDown(secondsLeft);
      },
      async () => {
        // This executes when countdown reaches zero
        if (!userId || !messageToUse) return;
        
        triggerPanicMessageWithCallbacks(
          userId,
          messageToUse.message_id,
          {
            onSuccess: (result) => {
              // Reset UI state after a short delay
              setTimeout(() => {
                setInCancelWindow(false);
                setPanicMode(false);
                setIsConfirming(false);
                setTriggerInProgress(false);
                setSelectedMessageId(null);
                
                // Handle keep armed status
                if (result.keepArmed) {
                  toast({
                    title: "Emergency message still armed",
                    description: "Your emergency message remains active and can be triggered again if needed."
                  });
                  // Dispatch an event to refresh conditions
                  window.dispatchEvent(new CustomEvent('conditions-updated', { 
                    detail: { 
                      updatedAt: new Date().toISOString(),
                      triggerValue: Date.now()
                    }
                  }));
                } else {
                  navigate('/messages'); // Redirect to messages page
                }
              }, 3000);
            },
            onError: (error) => {
              setInCancelWindow(false);
              setPanicMode(false);
              setIsConfirming(false);
              setTriggerInProgress(false);
            }
          }
        );
      }
    );
    
    // Store the timer reference to be able to cancel it
    const timer = setTimeout(() => {
      // This is just a safety cleanup, the actual trigger happens in countdown onComplete
      countdown.stop();
      setCancelWindowTimer(null);
    }, (cancelWindowSecs + 1) * 1000);
    
    // Store the timer reference
    setCancelWindowTimer(timer as unknown as NodeJS.Timeout);
  };

  // Cancel the panic trigger during the cancellation window
  const cancelPanicTrigger = () => {
    if (inCancelWindow && cancelWindowTimer) {
      // Clear the timeout that would send the message
      clearTimeout(cancelWindowTimer);
      setCancelWindowTimer(null);
      
      // Clear the countdown interval
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdownInterval(null);
      }
      
      // Reset the UI state
      setInCancelWindow(false);
      setPanicMode(false);
      setIsConfirming(false);
      setTriggerInProgress(false);
      setCountDown(0);
      
      toast({
        title: "Emergency Alert Cancelled",
        description: "The emergency message has been cancelled successfully.",
      });
    }
  };

  // Handle message selection from the selector dialog
  const handlePanicMessageSelect = (messageId: string) => {
    console.log(`Selected panic message: ${messageId}`);
    setSelectedMessageId(messageId);
    
    // After selecting a message, proceed with starting the countdown
    startCancellationCountdown();
  };

  // Handle panic button click with location permission check
  const handlePanicButtonClick = () => {
    // If we're in the cancel window, allow cancellation
    if (inCancelWindow) {
      cancelPanicTrigger();
      return;
    }
    
    // If not in cancel window and not confirming, this is first click
    // Check/request location and start countdown
    if (locationPermission === "granted") {
      // If we have multiple messages, show selector instead of immediately triggering
      if (panicMessages.length > 1) {
        setIsSelectorOpen(true);
      } else {
        startCancellationCountdown();
      }
    } else if (locationPermission === "prompt" || locationPermission === "unknown") {
      requestLocationPermission(
        // On granted
        () => {
          setLocationPermission("granted");
          
          // If we have multiple messages, show selector instead of immediately triggering
          if (panicMessages.length > 1) {
            setIsSelectorOpen(true);
          } else {
            startCancellationCountdown();
          }
        },
        // On denied
        () => {
          setLocationPermission("denied");
          toast({
            title: "Location Access Denied",
            description: "Your current location won't be included in the emergency message. Consider enabling location access for better assistance.",
            variant: "destructive"
          });
          
          // Continue with panic trigger even without location
          // If we have multiple messages, show selector instead of immediately triggering
          if (panicMessages.length > 1) {
            setIsSelectorOpen(true);
          } else {
            startCancellationCountdown();
          }
        }
      );
    } else {
      // Location permission denied but still allow triggering
      // If we have multiple messages, show selector instead of immediately triggering
      if (panicMessages.length > 1) {
        setIsSelectorOpen(true);
      } else {
        startCancellationCountdown();
      }
    }
  };

  // Create new panic message
  const handleCreatePanicMessage = () => {
    navigate('/create-message');
  };

  return {
    panicMode,
    isConfirming,
    triggerInProgress,
    countDown,
    locationPermission,
    checkLocationPermission: async () => {
      const permission = await checkLocationPermission();
      setLocationPermission(permission);
      return permission;
    },
    handlePanicButtonClick,
    handlePanicMessageSelect,
    handleCreatePanicMessage,
    getKeepArmedValue: () => getKeepArmedValue(selectedMessageId, panicMessages, panicMessage),
    isSelectorOpen,
    setIsSelectorOpen,
    selectedMessageId,
    setSelectedMessageId,
    inCancelWindow
  };
}
