
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
  executePanicTrigger: (messageId: string) => Promise<void>,
  startCancellationCountdown: (params: any) => void,
  cancelPanicTrigger: () => void
) {
  const navigate = useNavigate();

  // Handle panic button click
  const handlePanicButtonClick = useCallback(() => {
    // If in cancel window, cancel the panic trigger
    if (inCancelWindow) {
      cancelPanicTrigger();
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
      // If already confirming, start the cancellation countdown
      refreshLocationPermission().then(permission => {
        startCancellationCountdown({
          userId: null, // Will be passed from the component
          panicMessage: null,
          panicMessages,
          selectedMessageId: messageId,
          setInCancelWindow: () => {}, // Will be handled by countdown manager
          setPanicMode,
          setTriggerInProgress
        });
      });
    } else {
      // First press, just show confirmation
      setIsConfirming(true);
      
      // Auto-reset confirmation state if not clicked again
      setTimeout(() => {
        setIsConfirming(false);
      }, 3000);
    }
  }, [
    inCancelWindow, panicMessages.length, panicMode, isConfirming,
    refreshLocationPermission, getActiveMessageId, startCancellationCountdown,
    cancelPanicTrigger, setPanicMode, setIsConfirming, setTriggerInProgress,
    setIsSelectorOpen
  ]);
  
  // Handle panic message selection - now starts countdown instead of immediate execution
  const handlePanicMessageSelect = useCallback((messageId: string) => {
    console.log(`Selected panic message for countdown: ${messageId}`);
    setSelectedMessageId(messageId);
    setIsSelectorOpen(false);
    
    // Start cancellation countdown instead of immediate execution
    refreshLocationPermission().then(permission => {
      startCancellationCountdown({
        userId: null, // Will be passed from the component
        panicMessage: null,
        panicMessages,
        selectedMessageId: messageId,
        setInCancelWindow: () => {}, // Will be handled by countdown manager
        setPanicMode,
        setTriggerInProgress
      });
    });
  }, [refreshLocationPermission, startCancellationCountdown, setSelectedMessageId, setIsSelectorOpen, panicMessages, setPanicMode, setTriggerInProgress]);
  
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
