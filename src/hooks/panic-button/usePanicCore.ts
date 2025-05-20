
import { useNavigate } from "react-router-dom";
import { MessageCondition } from "@/types/message";
import { getKeepArmedValue } from "./messageConfigUtils";
import { usePanicState } from "./usePanicState";
import { useLocationManager } from "./useLocationManager";
import { useActiveMessage } from "./useActiveMessage";
import { usePanicTrigger } from "./usePanicTrigger";
import { usePanicButtonHandlers } from "./usePanicButtonHandlers";

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
      setCountDown,
      setRetryAttempts,
      retryAttempts
    },
    options
  );
  
  // Use the panic button handlers hook
  const {
    handlePanicButtonClick,
    handlePanicMessageSelect,
    handleCreatePanicMessage
  } = usePanicButtonHandlers(
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
    },
    panicMessages,
    getActiveMessageId,
    refreshLocationPermission,
    executePanicTrigger
  );
  
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
