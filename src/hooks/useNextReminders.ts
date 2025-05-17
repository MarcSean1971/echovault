
import { useState, useEffect } from "react";
import { useScheduledReminders } from "./reminder/useScheduledReminders";

/**
 * Simplified hook that wraps useScheduledReminders and only exposes
 * the upcoming reminders information
 */
export function useNextReminders(messageId: string, refreshTrigger: number = 0) {
  const {
    upcomingReminders,
    hasSchedule: hasReminders,
    isLoading,
    lastRefreshed,
    permissionError,
    forceRefresh
  } = useScheduledReminders(messageId, refreshTrigger);

  // This hook simply wraps useScheduledReminders for backward compatibility
  return {
    upcomingReminders,
    hasReminders,
    isLoading,
    lastRefreshed,
    permissionError,
    forceRefresh
  };
}
