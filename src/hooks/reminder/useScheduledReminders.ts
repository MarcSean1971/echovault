
import { useState, useEffect } from "react";
import { useReminderDataFetcher } from "./useReminderDataFetcher";
import { useReminderFormatter } from "./useReminderFormatter";
import { ScheduledReminderInfo } from "./types";

/**
 * Hook to get information about scheduled and sent reminders
 * This hook is optimized to avoid N+1 query issues by using a proper batch fetching strategy
 * when viewing message details
 * Updated to handle RLS permission errors gracefully
 */
export function useScheduledReminders(messageId: string, refreshTrigger: number = 0) {
  // Fetch and format reminder data hooks
  const { fetchReminderData, isLoading: isFetching, permissionError } = useReminderDataFetcher(messageId);
  const { formatReminderData, refreshFormattedTimes } = useReminderFormatter();
  
  // Local state
  const [scheduledInfo, setScheduledInfo] = useState<ScheduledReminderInfo>({
    nextReminder: null,
    formattedNextReminder: null,
    lastReminder: {
      sentAt: null,
      scheduledFor: null,
      formattedSentAt: null,
      formattedScheduledFor: null
    },
    isLoading: true,
    upcomingReminders: [],
    hasSchedule: false,
    lastRefreshed: Date.now(),
    permissionError: false
  });
  
  // Add a local refresh counter to force updates
  const [localRefreshCounter, setLocalRefreshCounter] = useState(0);

  // Function to force a refresh of the data
  const forceRefresh = () => {
    console.log(`[useScheduledReminders] Force refreshing data for message ${messageId}`);
    setLocalRefreshCounter(prev => prev + 1);
  };

  // Main data fetching effect
  useEffect(() => {
    // Skip if no messageId is provided
    if (!messageId) {
      setScheduledInfo(prev => ({ ...prev, isLoading: false }));
      return;
    }
    
    const loadReminderData = async () => {
      setScheduledInfo(prev => ({ ...prev, isLoading: true }));
      
      const result = await fetchReminderData();
      
      if (result) {
        const { upcomingReminders, reminderHistory } = result;
        
        // Format the reminder data
        const formattedData = formatReminderData(upcomingReminders, reminderHistory);
        
        // Update state with all information and current timestamp
        setScheduledInfo({
          ...formattedData,
          isLoading: false,
          lastRefreshed: Date.now(),
          permissionError: false
        });
      } else {
        setScheduledInfo(prev => ({ 
          ...prev, 
          isLoading: false,
          permissionError: permissionError 
        }));
      }
    };
    
    loadReminderData();
    
    // Set up a timer to refresh the formatted times
    const timer = setInterval(() => {
      setScheduledInfo(prev => {
        if (!prev.nextReminder && !prev.lastReminder.sentAt) {
          return prev; // No dates to update
        }
        
        // Update the formatted times using our formatter hook
        const refreshedTimes = refreshFormattedTimes({
          nextReminder: prev.nextReminder,
          lastReminder: {
            sentAt: prev.lastReminder.sentAt,
            scheduledFor: prev.lastReminder.scheduledFor
          }
        });
        
        // Update the formatted strings for display
        return {
          ...prev,
          formattedNextReminder: refreshedTimes.formattedNextReminder,
          lastReminder: {
            ...prev.lastReminder,
            formattedSentAt: refreshedTimes.lastReminderFormatted.formattedSentAt,
            formattedScheduledFor: refreshedTimes.lastReminderFormatted.formattedScheduledFor
          }
        };
      });
    }, 60000); // Update every minute
    
    // Listen for global check-in events to force refresh
    const handleGlobalEvent = (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log(`[useScheduledReminders] Received conditions-updated event, forcing a refresh`);
        forceRefresh();
      }
    };
    
    window.addEventListener('conditions-updated', handleGlobalEvent);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('conditions-updated', handleGlobalEvent);
    };
  }, [messageId, refreshTrigger, localRefreshCounter, permissionError]);

  return {
    ...scheduledInfo,
    forceRefresh
  };
}
