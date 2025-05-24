
import { useState } from "react";
import { useMessageCard } from "@/hooks/useMessageCard";
import { useMessageLastCheckIn } from "@/hooks/useMessageLastCheckIn";
import { useDeadlineProgress } from "@/hooks/useDeadlineProgress";

export function useMessageCardState(messageId: string, localReminderRefreshCounter: number) {
  // Get condition, state and actions from our custom hook
  const { 
    isArmed, 
    deadline, 
    condition, 
    isPanicTrigger,
    refreshCounter,
    actionIsLoading,
    onArmMessage, 
    onDisarmMessage
  } = useMessageCard(messageId);
  
  // Get last check-in information
  const { formattedCheckIn, rawCheckInTime, isDeadmansSwitch } = useMessageLastCheckIn(condition);
  
  // Get deadline progress and countdown
  const { deadlineProgress, timeLeft } = useDeadlineProgress(
    isArmed, 
    deadline, 
    condition, 
    refreshCounter + localReminderRefreshCounter // Add local counter to force refresh
  );

  return {
    isArmed,
    deadline,
    condition,
    isPanicTrigger,
    refreshCounter,
    actionIsLoading,
    onArmMessage,
    onDisarmMessage,
    formattedCheckIn,
    rawCheckInTime,
    isDeadmansSwitch,
    deadlineProgress,
    timeLeft
  };
}
