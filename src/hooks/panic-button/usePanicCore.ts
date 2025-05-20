import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { MessageCondition } from "@/types/message";
import { 
  checkLocationPermission, 
  requestLocationPermission 
} from "./locationUtils";
import { 
  getKeepArmedValue 
} from "./messageConfigUtils";
import { 
  triggerPanicMessageWithCallbacks 
} from "./triggerUtils";
import { 
  createCountdownTimer 
} from "./countdownUtils";

interface UsePanicCoreOptions {
  onError?: (error: any) => void;
  onRetry?: () => void;
}

export function usePanicCore(
  userId: string | null | undefined, 
  panicMessage: MessageCondition | null,
  panicMessages: MessageCondition[] = [],
  options: UsePanicCoreOptions = {}
) {
  const navigate = useNavigate();
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [triggerInProgress, setTriggerInProgress] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [locationPermission, setLocationPermission] = useState<string>("unknown");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const maxRetries = 2;
  
  // Check if we have an active cancel window based on countDown
  const inCancelWindow = panicMode && countDown > 0;
  
  // Check if location permissions are available
  useEffect(() => {
    const initializeLocationPermission = async () => {
      const permission = await checkLocationPermission();
      setLocationPermission(permission);
    };
    
    initializeLocationPermission();
  }, []);
  
  // Refresh location permission on user interaction 
  const refreshLocationPermission = useCallback(async () => {
    const permission = await checkLocationPermission();
    setLocationPermission(permission);
    return permission;
  }, []);
  
  // Handle panic trigger logic with improved error handling
  const executePanicTrigger = async (messageId: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to trigger an emergency message",
        variant: "destructive"
      });
      return;
    }
    
    setTriggerInProgress(true);
    setPanicMode(true);
    
    try {
      await triggerPanicMessageWithCallbacks(
        userId, 
        messageId, 
        {
          maxRetries,
          onSuccess: (result) => {
            // Reset retry attempts
            setRetryAttempts(0);
            
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
            console.error("Failed to send panic message:", error);
            
            if (retryAttempts < maxRetries) {
              // Notify about retry
              if (options.onRetry) options.onRetry();
              
              // Increment retry attempts
              setRetryAttempts(prev => prev + 1);
              
              // Wait a bit and try again
              setTimeout(() => {
                console.log(`Auto-retrying panic message (${retryAttempts + 1}/${maxRetries})...`);
                executePanicTrigger(messageId);
              }, 1000);
              
              return;
            }
            
            // Reset state
            setPanicMode(false);
            setIsConfirming(false);
            setTriggerInProgress(false);
            setRetryAttempts(0);
            
            // Call error callback if provided
            if (options.onError) options.onError(error);
          }
        }
      );
    } catch (error: any) {
      console.error("Error in executePanicTrigger:", error);
      
      setPanicMode(false);
      setIsConfirming(false);
      setTriggerInProgress(false);
      
      // Call error callback if provided
      if (options.onError) options.onError(error);
    }
  };
  
  // Get active message ID - first selected, then active message, then first in list
  const getActiveMessageId = useCallback(() => {
    if (selectedMessageId) return selectedMessageId;
    if (panicMessage) return panicMessage.message_id;
    if (panicMessages.length > 0) return panicMessages[0].message_id;
    return null;
  }, [panicMessage, panicMessages, selectedMessageId]);
  
  // Handle panic button click
  const handlePanicButtonClick = useCallback(() => {
    // If in cancel window, cancel the panic trigger
    if (inCancelWindow) {
      setPanicMode(false);
      setIsConfirming(false);
      setTriggerInProgress(false);
      setCountDown(0);
      
      // Dispatch cancellation event
      window.dispatchEvent(new CustomEvent('panic-trigger-cancelled'));
      
      toast({
        title: "Emergency alert cancelled",
        description: "Your emergency message has been cancelled."
      });
      
      return;
    }
    
    // If multiple messages available, show selector
    if (panicMessages.length > 1 && !panicMode && !isConfirming && !selectedMessageId) {
      setIsSelectorOpen(true);
      return;
    }
    
    // Get active message ID
    const messageId = getActiveMessageId();
    
    if (!messageId) {
      toast({
        title: "No message selected",
        description: "Please select or create an emergency message",
        variant: "destructive"
      });
      return;
    }
    
    if (isConfirming) {
      // If already confirming, check/request location permission
      refreshLocationPermission().then(permission => {
        if (permission === "granted" || permission === "prompt" || permission === "denied") {
          // Even if denied, we proceed (just won't include location)
          executePanicTrigger(messageId);
        } else {
          toast({
            title: "Location Error",
            description: "Cannot access location services. Your message will send without location.",
            variant: "destructive"
          });
          executePanicTrigger(messageId);
        }
      });
    } else {
      // First press, just show confirmation
      setIsConfirming(true);
      
      // Auto-reset confirmation state if not clicked again
      setTimeout(() => {
        if (isConfirming) {
          setIsConfirming(false);
        }
      }, 3000);
    }
  }, [
    inCancelWindow, panicMessages, panicMode, isConfirming, 
    selectedMessageId, refreshLocationPermission, getActiveMessageId, 
    executePanicTrigger
  ]);
  
  // Handle panic message selection - FIXED: Now executes the trigger directly
  const handlePanicMessageSelect = useCallback((messageId: string) => {
    console.log(`Selected panic message for immediate trigger: ${messageId}`);
    setSelectedMessageId(messageId);
    setIsSelectorOpen(false);
    
    // Important change: Directly execute the panic trigger with the selected message
    // This ensures the "Trigger Emergency" button in the selector works immediately
    refreshLocationPermission().then(permission => {
      executePanicTrigger(messageId);
    });
  }, [refreshLocationPermission, executePanicTrigger]);
  
  // Create new panic message
  const handleCreatePanicMessage = useCallback(() => {
    navigate('/create-message');
  }, [navigate]);
  
  return {
    panicMode,
    isConfirming,
    triggerInProgress,
    countDown,
    locationPermission,
    inCancelWindow,
    isSelectorOpen,
    setIsSelectorOpen,
    selectedMessageId,
    setSelectedMessageId,
    checkLocationPermission: refreshLocationPermission,
    handlePanicButtonClick,
    executePanicTrigger,
    handlePanicMessageSelect,
    handleCreatePanicMessage,
    getKeepArmedValue: () => getKeepArmedValue(selectedMessageId, panicMessages, panicMessage),
  };
}
