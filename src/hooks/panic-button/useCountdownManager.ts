
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { MessageCondition } from "@/types/message";
import { getCancelWindowSeconds } from "./messageConfigUtils";
import { startCountdown } from "./countdownUtils";

/**
 * Hook for managing countdown related functionality with delivery completion reset
 */
export function useCountdownManager() {
  const [countDown, setCountDown] = useState(0);
  const [inCancelWindow, setInCancelWindow] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState<(() => void) | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cancelCountdown) {
        cancelCountdown();
      }
    };
  }, [cancelCountdown]);

  // Start the cancellation countdown
  const startCancellationCountdown = ({
    userId,
    panicMessage,
    panicMessages,
    selectedMessageId,
    setInCancelWindow: externalSetInCancelWindow,
    setPanicMode,
    setTriggerInProgress
  }: {
    userId: string | null | undefined,
    panicMessage: MessageCondition | null,
    panicMessages: MessageCondition[],
    selectedMessageId: string | null,
    setInCancelWindow: (value: boolean) => void,
    setPanicMode: (value: boolean) => void,
    setTriggerInProgress: (value: boolean) => void
  }) => {
    // Get the message to use
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

    // Set UI state to show cancellation window
    setInCancelWindow(true);
    externalSetInCancelWindow(true);
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
    
    // Use our utility to setup countdown
    const countdownControls = startCountdown(
      cancelWindowSecs,
      (secondsLeft) => {
        setCountDown(secondsLeft);
      },
      async () => {
        // This executes when countdown reaches zero
        if (!messageToUse) return;
        
        // Pass control to the core panic trigger function
        const event = new CustomEvent('panic-trigger-execute', { 
          detail: { 
            messageId: messageToUse.message_id 
          }
        });
        window.dispatchEvent(event);
        
        // ENHANCED: Emit delivery completion event for panic triggers
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('message-delivery-complete', { 
            detail: { 
              messageId: messageToUse.message_id,
              conditionId: messageToUse.id,
              deliveryType: 'panic',
              source: 'countdown-manager',
              completedAt: new Date().toISOString()
            }
          }));
        }, 1000); // Small delay to allow delivery to complete
      }
    );
    
    // Store the cancel function
    setCancelCountdown(() => countdownControls.stop);
  };

  // Cancel the panic trigger during the cancellation window
  const cancelPanicTrigger = () => {
    if (inCancelWindow && cancelCountdown) {
      // Stop the countdown
      cancelCountdown();
      setCancelCountdown(null);
      
      // Reset the UI state
      setInCancelWindow(false);
      setCountDown(0);
      
      toast({
        title: "Emergency Alert Cancelled",
        description: "The emergency message has been cancelled successfully.",
      });

      // Dispatch cancellation event
      window.dispatchEvent(new CustomEvent('panic-trigger-cancelled'));
    }
  };

  return {
    countDown,
    inCancelWindow,
    setInCancelWindow,
    startCancellationCountdown,
    cancelPanicTrigger
  };
}
