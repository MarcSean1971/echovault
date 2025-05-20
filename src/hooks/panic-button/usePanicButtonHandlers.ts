
import { useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { MessageCondition } from "@/types/message";

/**
 * Hook for handling various panic button interactions
 */
export function usePanicButtonHandlers(
  {
    panicMode,
    isConfirming,
    inCancelWindow,
    setIsConfirming,
    setPanicMode,
    setTriggerInProgress,
    setCountDown,
    setIsSelectorOpen,
    setSelectedMessageId,
  }: {
    panicMode: boolean;
    isConfirming: boolean;
    inCancelWindow: boolean;
    setIsConfirming: (value: boolean) => void;
    setPanicMode: (value: boolean) => void;
    setTriggerInProgress: (value: boolean) => void;
    setCountDown: (value: number) => void;
    setIsSelectorOpen: (value: boolean) => void;
    setSelectedMessageId: (value: string | null) => void;
  },
  panicMessages: MessageCondition[],
  getActiveMessageId: () => string | null,
  refreshLocationPermission: () => Promise<string>,
  executePanicTrigger: (messageId: string) => Promise<void>
) {
  const navigate = useNavigate();

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
    if (panicMessages.length > 1 && !panicMode && !isConfirming && !getActiveMessageId()) {
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
    inCancelWindow, panicMessages.length, panicMode, isConfirming,
    refreshLocationPermission, getActiveMessageId, executePanicTrigger,
    setPanicMode, setIsConfirming, setTriggerInProgress, setCountDown,
    setIsSelectorOpen
  ]);
  
  // Handle panic message selection - executes the trigger directly
  const handlePanicMessageSelect = useCallback((messageId: string) => {
    console.log(`Selected panic message for immediate trigger: ${messageId}`);
    setSelectedMessageId(messageId);
    setIsSelectorOpen(false);
    
    // Important: Directly execute the panic trigger with the selected message
    refreshLocationPermission().then(permission => {
      executePanicTrigger(messageId);
    });
  }, [refreshLocationPermission, executePanicTrigger, setSelectedMessageId, setIsSelectorOpen]);
  
  // Create new panic message
  const handleCreatePanicMessage = useCallback(() => {
    navigate('/create-message');
  }, [navigate]);

  return {
    handlePanicButtonClick,
    handlePanicMessageSelect,
    handleCreatePanicMessage
  };
}
