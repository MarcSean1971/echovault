
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
  
  // Use the core panic button hook
  const panicCore = usePanicCore(userId, panicMessage, panicMessages);
  
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
    getKeepArmedValue
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
