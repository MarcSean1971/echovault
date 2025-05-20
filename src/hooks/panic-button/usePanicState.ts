
import { useState } from "react";

/**
 * Hook for managing panic button state
 */
export function usePanicState() {
  const [panicMode, setPanicMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [triggerInProgress, setTriggerInProgress] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [locationPermission, setLocationPermission] = useState<string>("unknown");
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Check if we have an active cancel window based on countDown
  const inCancelWindow = panicMode && countDown > 0;
  
  return {
    panicMode,
    setPanicMode,
    isConfirming,
    setIsConfirming,
    triggerInProgress,
    setTriggerInProgress,
    countDown,
    setCountDown,
    locationPermission,
    setLocationPermission,
    retryAttempts,
    setRetryAttempts,
    selectedMessageId,
    setSelectedMessageId,
    isSelectorOpen,
    setIsSelectorOpen,
    inCancelWindow
  };
}
