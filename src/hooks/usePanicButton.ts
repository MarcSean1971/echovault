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
    };
  }, [cancelWindowTimer]);

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
            handlePanicTrigger();
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
            handlePanicTrigger();
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
        handlePanicTrigger();
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
    return config?.cancel_window_seconds ?? 0; // Default 0 means no cancel window
  };

  // Cancel the panic trigger during the cancellation window
  const cancelPanicTrigger = () => {
    if (inCancelWindow && cancelWindowTimer) {
      // Clear the timeout that would send the message
      clearTimeout(cancelWindowTimer);
      setCancelWindowTimer(null);
      
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

  // Handle panic trigger - now with message selection and cancellation window
  const handlePanicTrigger = async () => {
    // If we're already in the cancellation window, cancel the trigger
    if (inCancelWindow) {
      cancelPanicTrigger();
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "User not logged in",
        variant: "destructive"
      });
      return;
    }
    
    // Determine which message to use
    const messageToUse = selectedMessageId 
      ? panicMessages.find(m => m.message_id === selectedMessageId)
      : (panicMessage || (panicMessages.length > 0 ? panicMessages[0] : null));
    
    if (!messageToUse) {
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
      
      // Get the cancel window seconds from the config
      const cancelWindowSecs = getCancelWindowSeconds();
      console.log(`Cancel window seconds: ${cancelWindowSecs}`);
      
      // If there's a cancellation window, show it
      if (cancelWindowSecs > 0) {
        setInCancelWindow(true);
        
        // Show toast with cancellation option
        toast({
          title: "EMERGENCY ALERT PENDING",
          description: `Your emergency message will be sent in ${cancelWindowSecs} seconds. Click the button again to cancel.`,
          variant: "destructive",
        });
        
        // Start countdown for visual feedback
        let secondsLeft = cancelWindowSecs;
        setCountDown(secondsLeft);
        
        // Create interval for countdown display
        const countdownInterval = setInterval(() => {
          secondsLeft -= 1;
          setCountDown(secondsLeft);
          
          if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
          }
        }, 1000);
        
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
      } else {
        // No cancel window - send message immediately
        try {
          console.log(`Triggering panic message immediately: ${messageToUse.message_id}`);
          
          // Log config to help with debugging
          if (messageToUse.panic_trigger_config) {
            console.log("Using panic_trigger_config:", messageToUse.panic_trigger_config);
          }
          if (messageToUse.panic_config) {
            console.log("Found panic_config as well:", messageToUse.panic_config);
          }
          
          // Try triggering the panic message
          const result = await triggerPanicMessage(userId, messageToUse.message_id);
          
          console.log("Panic trigger result:", result);
          
          if (result.success) {
            toast({
              title: "EMERGENCY ALERT TRIGGERED",
              description: "Your emergency message with your current location and attachments is being sent immediately.",
              variant: "destructive"
            });
            
            // Start countdown for visual feedback
            let secondsLeft = 3;
            setCountDown(secondsLeft);
            
            // Dispatch event with panic message ID
            window.dispatchEvent(new CustomEvent('conditions-updated', { 
              detail: { 
                updatedAt: new Date().toISOString(),
                triggerValue: Date.now(),
                panicTrigger: true,
                panicMessageId: messageToUse.message_id
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
                setSelectedMessageId(null);
                
                // If the message is still armed (keepArmed=true), refresh to show it's still active
                // Otherwise navigate to messages
                if (result.keepArmed) {
                  console.log("Message stays armed (keepArmed=true). Refreshing UI state.");
                  toast({
                    title: "Emergency message still armed",
                    description: "Your emergency message remains active and can be triggered again if needed."
                  });
                  // Dispatch an event to refresh conditions instead of reloading the page
                  window.dispatchEvent(new CustomEvent('conditions-updated', { 
                    detail: { 
                      updatedAt: new Date().toISOString(),
                      triggerValue: Date.now()
                    }
                  }));
                } else {
                  console.log("Message is now disarmed (keepArmed=false). Navigating to messages.");
                  navigate('/messages'); // Redirect to messages page
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
  
  // Handle message selection from the selector dialog
  const handlePanicMessageSelect = (messageId: string) => {
    console.log(`Selected panic message: ${messageId}`);
    setSelectedMessageId(messageId);
    
    // After selecting a message, proceed with triggering it
    setIsConfirming(true);
    handlePanicTrigger();
  };

  // Handle panic button click with location permission check
  const handlePanicButtonClick = () => {
    // If we're in the cancel window, allow cancellation
    if (inCancelWindow) {
      cancelPanicTrigger();
      return;
    }
    
    if (isConfirming) {
      // If already confirming, check/request location permission
      if (locationPermission === "granted") {
        // If we have multiple messages, show selector instead of immediately triggering
        if (panicMessages.length > 1) {
          setIsSelectorOpen(true);
        } else {
          handlePanicTrigger();
        }
      } else if (locationPermission === "prompt" || locationPermission === "unknown") {
        requestLocationPermission();
      } else {
        // Location permission denied but still allow triggering
        // If we have multiple messages, show selector instead of immediately triggering
        if (panicMessages.length > 1) {
          setIsSelectorOpen(true);
        } else {
          handlePanicTrigger();
        }
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
