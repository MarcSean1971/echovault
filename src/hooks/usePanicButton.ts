
import { useState, useEffect } from "react";
import { MessageCondition } from "@/types/message";
import { hasActivePanicMessages } from "@/services/messages/conditions/panicTriggerService";
import { usePanicCore } from "./panic-button/usePanicCore";

/**
 * Main hook for panic button functionality
 * This is now a lightweight wrapper around more focused hooks
 */
export function usePanicButton(
  userId: string | null | undefined, 
  panicMessage: MessageCondition | null,
  panicMessages: MessageCondition[] = []
) {
  const [hasPanicMessages, setHasPanicMessages] = useState(false);
  const [errorState, setErrorState] = useState<{
    hasError: boolean;
    message?: string;
    isRetrying?: boolean;
  }>({
    hasError: false
  });
  
  // Use the core panic button hook with error handling
  const panicCore = usePanicCore(userId, panicMessage, panicMessages, {
    onError: (error) => {
      setErrorState({
        hasError: true,
        message: error.message || "Failed to send emergency message",
        isRetrying: false
      });
      
      // Auto-clear error after 10 seconds
      setTimeout(() => {
        setErrorState({ hasError: false });
      }, 10000);
    },
    onRetry: () => {
      setErrorState(prev => ({
        ...prev,
        isRetrying: true
      }));
    }
  });
  
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
    
    if (panicMessages.length === 0 && userId) {
      checkPanicMessages();
    } else if (panicMessages.length > 0) {
      setHasPanicMessages(true);
    }
  }, [userId, panicMessages]);
  
  // Listen for panic trigger execution event
  useEffect(() => {
    const handlePanicTriggerExecute = (event: Event) => {
      if (!userId) return;
      
      const messageId = (event as CustomEvent).detail?.messageId;
      if (messageId) {
        panicCore.executePanicTrigger(messageId);
      }
    };
    
    window.addEventListener('panic-trigger-execute', handlePanicTriggerExecute);
    
    return () => {
      window.removeEventListener('panic-trigger-execute', handlePanicTriggerExecute);
    };
  }, [userId, panicCore]);
  
  // Listen for panic trigger cancellation event
  useEffect(() => {
    const handlePanicTriggerCancelled = () => {
      // Reset UI state related to panic mode
      setPanicMode(false);
      setIsConfirming(false);
      setTriggerInProgress(false);
      setErrorState({ hasError: false });
    };
    
    window.addEventListener('panic-trigger-cancelled', handlePanicTriggerCancelled);
    
    return () => {
      window.removeEventListener('panic-trigger-cancelled', handlePanicTriggerCancelled);
    };
  }, []);
  
  // Destructure what we need from panicCore
  const {
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
    checkLocationPermission,
    handlePanicButtonClick,
    handlePanicMessageSelect,
    handleCreatePanicMessage,
    getKeepArmedValue,
    executePanicTrigger  // Make sure we destructure the executePanicTrigger function
  } = panicCore;
  
  // For compatibility with existing components, export these state setters
  const setIsConfirming = useState(false)[1];
  const setPanicMode = useState(false)[1];
  const setTriggerInProgress = useState(false)[1];
  
  return {
    panicMode,
    isConfirming,
    triggerInProgress,
    countDown,
    hasPanicMessages,
    locationPermission,
    errorState,
    checkLocationPermission,
    handlePanicButtonClick,
    handlePanicMessageSelect,
    handleCreatePanicMessage,
    getKeepArmedValue,
    isSelectorOpen,
    setIsSelectorOpen,
    selectedMessageId,
    setSelectedMessageId,
    inCancelWindow,
    executePanicTrigger  // Add the executePanicTrigger function to the returned object
  };
}
