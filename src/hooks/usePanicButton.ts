import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { triggerPanicMessage } from "@/services/messages/conditions/panicTriggerService";
import { MessageCondition } from "@/types/message";
import { useNavigate } from "react-router-dom";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

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
    checkLocationPermission();
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

  // Check location permissions
  const checkLocationPermission = async () => {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(result.state);
        
        // Listen for permission changes
        result.onchange = () => {
          setLocationPermission(result.state);
        };
        return result.state;
      } catch (err) {
        console.error("Error checking location permissions:", err);
        setLocationPermission("denied");
        return "denied";
      }
    }
    return locationPermission;
  };

  // Request location permission
  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission("granted");
          
          // If we have multiple messages, show selector instead of immediately triggering
          if (panicMessages.length > 1) {
            setIsSelectorOpen(true);
          } else {
            startCancellationCountdown();
          }
        },
        (error) => {
          console.error("Location permission denied:", error);
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
      toast({
        title: "Location Not Available",
        description: "Your device doesn't support location services. The emergency message will be sent without your location.",
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
  };

  // Get message config from the selected message or default message
  const getMessageConfig = () => {
    const message = selectedMessageId 
      ? panicMessages.find(m => m.message_id === selectedMessageId) 
      : panicMessage;
    
    if (!message) return null;
    
    // First check panic_trigger_config
    if (message.panic_trigger_config) {
      return message.panic_trigger_config;
    }
    
    // Fall back to panic_config if panic_trigger_config is not available
    if (message.panic_config) {
      return message.panic_config;
    }
    
    return null;
  };

  // Get keep_armed value from config
  const getKeepArmedValue = () => {
    const config = getMessageConfig();
    return config?.keep_armed ?? true; // Default true for safety
  };

  // Get cancel window seconds from config
  const getCancelWindowSeconds = () => {
    const config = getMessageConfig();
    return config?.cancel_window_seconds ?? 5; // Default 5 seconds for cancellation window
  };

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
    const cancelWindowSecs = getCancelWindowSeconds();
    console.log(`Cancel window seconds: ${cancelWindowSecs}`);
    
    // Start countdown for visual feedback
    let secondsLeft = cancelWindowSecs;
    setCountDown(secondsLeft);
    
    // Create interval for countdown display
    const interval = setInterval(() => {
      secondsLeft -= 1;
      setCountDown(secondsLeft);
      
      if (secondsLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    setCountdownInterval(interval);
    
    // Show toast with cancellation option
    toast({
      title: "EMERGENCY ALERT PENDING",
      description: `Your emergency message will be sent in ${cancelWindowSecs} seconds. Click the button again to cancel.`,
      variant: "destructive",
    });
    
    // Create timeout for actual message sending after the cancel window
    const timer = setTimeout(async () => {
      try {
        // Actually send the message after the cancel window expires
        console.log(`Triggering panic message: ${messageToUse.message_id}`);
        const result = await triggerPanicMessage(userId, messageToUse.message_id);
        
        if (result.success) {
          toast({
            title: "EMERGENCY ALERT TRIGGERED",
            description: "Your emergency message with your current location and attachments has been sent.",
            variant: "destructive"
          });
          
          // Dispatch event with panic message ID
          window.dispatchEvent(new CustomEvent('conditions-updated', { 
            detail: { 
              updatedAt: new Date().toISOString(),
              triggerValue: Date.now(),
              panicTrigger: true,
              panicMessageId: messageToUse.message_id
            }
          }));
          
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
        }
      } catch (error: any) {
        console.error("Error triggering panic message:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to trigger panic message. Please try again.",
          variant: "destructive"
        });
        setInCancelWindow(false);
        setPanicMode(false);
        setIsConfirming(false);
        setTriggerInProgress(false);
      }
      
      // Clear the timer reference
      setCancelWindowTimer(null);
    }, cancelWindowSecs * 1000);
    
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
      requestLocationPermission();
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
    checkLocationPermission,
    handlePanicButtonClick,
    handlePanicMessageSelect,
    handleCreatePanicMessage,
    getKeepArmedValue,
    isSelectorOpen,
    setIsSelectorOpen,
    selectedMessageId,
    setSelectedMessageId,
    inCancelWindow
  };
}
