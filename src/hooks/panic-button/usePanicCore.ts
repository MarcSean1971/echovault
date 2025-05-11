import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { MessageCondition } from "@/types/message";
import { useLocationPermission } from "./useLocationPermission";
import { useCountdownManager } from "./useCountdownManager";
import { usePanicMessageSelector } from "./usePanicMessageSelector";
import { 
  getKeepArmedValue 
} from "./messageConfigUtils";
import { 
  triggerPanicMessageWithCallbacks 
} from "./triggerUtils";

/**
 * Core hook for panic button functionality
 */
export function usePanicCore(
  userId: string | null | undefined, 
  panicMessage: MessageCondition | null,
  panicMessages: MessageCondition[] = []
) {
  const navigate = useNavigate();
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [triggerInProgress, setTriggerInProgress] = useState(false);
  
  // Use the extracted hooks
  const { locationPermission, checkLocationPermission, requestLocationPermission } = useLocationPermission();
  
  const { 
    countDown, 
    startCancellationCountdown, 
    cancelPanicTrigger,
    inCancelWindow, 
    setInCancelWindow 
  } = useCountdownManager();
  
  const {
    isSelectorOpen, 
    setIsSelectorOpen,
    selectedMessageId, 
    setSelectedMessageId,
    handlePanicMessageSelect
  } = usePanicMessageSelector(startCancellationCountdown);

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
        startCancellationCountdown({
          userId,
          panicMessage,
          panicMessages,
          selectedMessageId,
          setInCancelWindow,
          setPanicMode,
          setTriggerInProgress
        });
      }
    } else if (locationPermission === "prompt" || locationPermission === "unknown") {
      requestLocationPermission(
        // On granted
        () => {
          // If we have multiple messages, show selector instead of immediately triggering
          if (panicMessages.length > 1) {
            setIsSelectorOpen(true);
          } else {
            startCancellationCountdown({
              userId,
              panicMessage,
              panicMessages,
              selectedMessageId,
              setInCancelWindow,
              setPanicMode,
              setTriggerInProgress
            });
          }
        },
        // On denied
        () => {
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
            startCancellationCountdown({
              userId,
              panicMessage,
              panicMessages,
              selectedMessageId,
              setInCancelWindow,
              setPanicMode,
              setTriggerInProgress
            });
          }
        }
      );
    } else {
      // Location permission denied but still allow triggering
      // If we have multiple messages, show selector instead of immediately triggering
      if (panicMessages.length > 1) {
        setIsSelectorOpen(true);
      } else {
        startCancellationCountdown({
          userId,
          panicMessage,
          panicMessages,
          selectedMessageId,
          setInCancelWindow,
          setPanicMode,
          setTriggerInProgress
        });
      }
    }
  };

  // Create new panic message
  const handleCreatePanicMessage = () => {
    navigate('/create-message');
  };

  const executePanicTrigger = async (messageId: string) => {
    if (!userId) return;
    
    try {
      await triggerPanicMessageWithCallbacks(
        userId,
        messageId,
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
    } catch (error) {
      console.error("Error executing panic trigger:", error);
    }
  };

  return {
    // States
    panicMode,
    isConfirming,
    triggerInProgress,
    countDown,
    locationPermission,
    inCancelWindow,
    
    // Message selector related
    isSelectorOpen,
    setIsSelectorOpen,
    selectedMessageId,
    setSelectedMessageId,
    
    // Actions
    checkLocationPermission,
    handlePanicButtonClick,
    handlePanicMessageSelect,
    handleCreatePanicMessage,
    executePanicTrigger,
    
    // Utils
    getKeepArmedValue: () => getKeepArmedValue(selectedMessageId, panicMessages, panicMessage),
  };
}
