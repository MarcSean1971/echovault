
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCondition } from "@/types/message";
import { getKeepArmedValue } from "./messageConfigUtils";
import { usePanicState } from "./usePanicState";
import { useLocationManager } from "./useLocationManager";
import { useActiveMessage } from "./useActiveMessage";
import { usePanicTrigger } from "./usePanicTrigger";
import { usePanicButtonHandlers } from "./usePanicButtonHandlers";
import { useCountdownManager } from "./useCountdownManager";

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
  const maxRetries = 2;
  
  // Use the state management hook
  const {
    panicMode,
    setPanicMode,
    isConfirming,
    setIsConfirming,
    triggerInProgress,
    setTriggerInProgress,
    countDown: panicStateCountDown,
    setCountDown: setPanicStateCountDown,
    locationPermission,
    setLocationPermission,
    retryAttempts,
    setRetryAttempts,
    selectedMessageId,
    setSelectedMessageId,
    isSelectorOpen,
    setIsSelectorOpen,
    inCancelWindow: panicStateInCancelWindow
  } = usePanicState();
  
  // Use the location management hook
  const { refreshLocationPermission } = useLocationManager(setLocationPermission);
  
  // Use the active message hook
  const { getActiveMessageId } = useActiveMessage(panicMessage, panicMessages, selectedMessageId);
  
  // Use the panic trigger hook
  const { executePanicTrigger } = usePanicTrigger(
    userId,
    maxRetries,
    {
      setPanicMode,
      setTriggerInProgress,
      setIsConfirming,
      setCountDown: setPanicStateCountDown,
      setRetryAttempts,
      retryAttempts
    },
    options
  );
  
  // Use the countdown manager hook
  const {
    countDown: countdownManagerSeconds,
    inCancelWindow: countdownManagerInCancelWindow,
    setInCancelWindow,
    startCancellationCountdown,
    cancelPanicTrigger
  } = useCountdownManager();
  
  // Use countdown from countdown manager when available, fallback to panic state
  const activeCountDown = countdownManagerSeconds > 0 ? countdownManagerSeconds : panicStateCountDown;
  const activeInCancelWindow = countdownManagerInCancelWindow || panicStateInCancelWindow;
  
  // Use the panic button handlers hook
  const {
    handlePanicButtonClick,
    handlePanicMessageSelect,
    handleCreatePanicMessage
  } = usePanicButtonHandlers(
    {
      panicMode,
      isConfirming,
      inCancelWindow: activeInCancelWindow,
      setIsConfirming,
      setPanicMode,
      setTriggerInProgress,
      setCountDown: setPanicStateCountDown,
      setIsSelectorOpen,
      setSelectedMessageId,
    },
    panicMessages,
    getActiveMessageId,
    refreshLocationPermission,
    executePanicTrigger,
    startCancellationCountdown,
    cancelPanicTrigger
  );
  
  // ENHANCED: Listen for panic delivery completion to reset all states
  useEffect(() => {
    const handlePanicDeliveryComplete = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const { deliveryType, messageId } = event.detail || {};
      
      // Only reset if this was a panic delivery
      if (deliveryType === 'panic' || deliveryType === 'emergency') {
        console.log('[PanicCore] Panic delivery completed, resetting all panic states');
        
        // Reset all panic-related states
        setPanicMode(false);
        setIsConfirming(false);
        setTriggerInProgress(false);
        setPanicStateCountDown(0);
        setRetryAttempts(0);
        setSelectedMessageId(null);
        setIsSelectorOpen(false);
        setInCancelWindow(false);
        
        // Navigate back to messages with refresh
        setTimeout(() => {
          navigate('/messages');
        }, 1000);
      }
    };
    
    window.addEventListener('message-delivery-complete', handlePanicDeliveryComplete);
    
    return () => {
      window.removeEventListener('message-delivery-complete', handlePanicDeliveryComplete);
    };
  }, [setPanicMode, setIsConfirming, setTriggerInProgress, setPanicStateCountDown, setRetryAttempts, setSelectedMessageId, setIsSelectorOpen, setInCancelWindow, navigate]);
  
  return {
    panicMode,
    isConfirming,
    triggerInProgress,
    countDown: activeCountDown,
    locationPermission,
    inCancelWindow: activeInCancelWindow,
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
