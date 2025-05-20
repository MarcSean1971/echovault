import { useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { triggerPanicMessageWithCallbacks } from "./triggerUtils";
import { createCountdownTimer } from "./countdownUtils";
import { useNavigate } from "react-router-dom";

interface UsePanicTriggerOptions {
  onError?: (error: any) => void;
  onRetry?: () => void;
}

/**
 * Hook for handling the panic trigger execution
 */
export function usePanicTrigger(
  userId: string | null | undefined,
  maxRetries: number,
  {
    setPanicMode,
    setTriggerInProgress,
    setIsConfirming,
    setCountDown,
    setRetryAttempts,
    retryAttempts
  }: {
    setPanicMode: (value: boolean) => void;
    setTriggerInProgress: (value: boolean) => void;
    setIsConfirming: (value: boolean) => void;
    setCountDown: (value: number) => void;
    setRetryAttempts: (value: ((prev: number) => number) | number) => void;
    retryAttempts: number;
  },
  options: UsePanicTriggerOptions = {}
) {
  const navigate = useNavigate();
  
  // Handle panic trigger logic with improved error handling
  const executePanicTrigger = useCallback(async (messageId: string) => {
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
  }, [
    userId, maxRetries, navigate, setPanicMode, setTriggerInProgress, 
    setIsConfirming, setCountDown, setRetryAttempts, retryAttempts,
    options.onError, options.onRetry
  ]);

  return {
    executePanicTrigger
  };
}
