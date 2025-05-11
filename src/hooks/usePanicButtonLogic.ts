import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { MessageCondition } from "@/types/message";
import { hasActivePanicMessages } from "@/services/messages/conditions/panicTriggerService";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { 
  checkLocationPermission, 
  requestLocationPermission 
} from "./panic-button/locationUtils";
import { 
  getKeepArmedValue 
} from "./panic-button/messageConfigUtils";
import { 
  triggerPanicMessageWithCallbacks 
} from "./panic-button/triggerUtils";
import { 
  createCountdownTimer 
} from "./panic-button/countdownUtils";

export function usePanicButtonLogic(
  userId: string | undefined,
  panicMessage: MessageCondition | null,
  isChecking: boolean,
  isLoading: boolean
) {
  const navigate = useNavigate();
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [triggerInProgress, setTriggerInProgress] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [hasPanicMessages, setHasPanicMessages] = useState(false);
  const [locationPermission, setLocationPermission] = useState<string>("unknown");

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

  // Check if location permissions are available
  useEffect(() => {
    const initializeLocationPermission = async () => {
      const permission = await checkLocationPermission();
      setLocationPermission(permission);
    };

    initializeLocationPermission();
  }, []);

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
        await triggerPanicMessageWithCallbacks(
          userId, 
          panicMessage.message_id, 
          {
            onSuccess: (result) => {
              // Start countdown for visual feedback
              const { timerId } = createCountdownTimer(
                3, 
                setCountDown,
                () => {
                  setPanicMode(false);
                  setIsConfirming(false);
                  setTriggerInProgress(false);
                  
                  // If the message is still armed (keepArmed=true), refresh to show it's still active
                  // Otherwise navigate to messages
                  if (result.keepArmed) {
                    console.log("Message stays armed (keepArmed=true). Refreshing page.");
                    toast({
                      title: "Emergency message still armed",
                      description: "Your emergency message remains active and can be triggered again if needed."
                    });
                    window.location.reload(); // Refresh to update the UI state
                  } else {
                    console.log("Message is now disarmed (keepArmed=false). Navigating to messages.");
                    navigate('/messages'); // Redirect to messages page
                  }
                }
              );
            },
            onError: (error) => {
              setPanicMode(false);
              setIsConfirming(false);
              setTriggerInProgress(false);
            }
          }
        );
      } catch (error: any) {
        console.error("Error triggering panic message:", error);
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
      } else if (locationPermission === "prompt" || locationPermission === "unknown") {
        requestLocationPermission(
          () => {
            setLocationPermission("granted");
            handlePanicTrigger();
          },
          () => {
            setLocationPermission("denied");
            toast({
              title: "Location Access Denied",
              description: "Your current location won't be included in the emergency message. Consider enabling location access for better assistance.",
              variant: "destructive"
            });
            // Continue with panic trigger even without location
            handlePanicTrigger();
          }
        );
      } else {
        // Location permission denied but still allow triggering
        handlePanicTrigger();
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
    hasPanicMessages,
    locationPermission,
    getKeepArmedValue: () => getKeepArmedValue(null, [], panicMessage),
    handlePanicButtonClick,
    handleCreatePanicMessage
  };
}
