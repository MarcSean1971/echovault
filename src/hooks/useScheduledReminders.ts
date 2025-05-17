
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { getReminderHistory } from "@/services/messages/reminderService";
import { getUpcomingReminders, formatReminderSchedule } from "@/utils/reminderScheduler";

export interface ScheduledReminderInfo {
  nextReminder: Date | null;
  formattedNextReminder: string | null;
  lastReminder: {
    sentAt: Date | null;
    scheduledFor: Date | null;
    formattedSentAt: string | null;
    formattedScheduledFor: string | null;
  };
  isLoading: boolean;
  upcomingReminders: string[];
  hasSchedule: boolean;
  lastRefreshed?: number;
}

/**
 * Hook to get information about scheduled and sent reminders
 */
export function useScheduledReminders(messageId: string, refreshTrigger: number = 0) {
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
    lastRefreshed: Date.now()
  });
  
  // Add a local refresh counter to force updates
  const [localRefreshCounter, setLocalRefreshCounter] = useState(0);

  // Function to force a refresh of the data
  const forceRefresh = () => {
    console.log(`[useScheduledReminders] Force refreshing data for message ${messageId}`);
    setLocalRefreshCounter(prev => prev + 1);
  };

  useEffect(() => {
    const fetchReminderData = async () => {
      try {
        console.log(`[useScheduledReminders] Fetching reminder data for message ${messageId} (refreshTrigger: ${refreshTrigger}, localCounter: ${localRefreshCounter})`);
        setScheduledInfo(prev => ({ ...prev, isLoading: true }));
        
        // Get upcoming reminders from the schedule
        const upcomingReminders = await getUpcomingReminders(messageId);
        const hasSchedule = upcomingReminders.length > 0;
        
        console.log(`[useScheduledReminders] Found ${upcomingReminders.length} upcoming reminders`);
        
        // Get reminder history for last reminders
        const reminderHistory = await getReminderHistory(messageId);
        
        // Process data and update state
        let nextReminderDate: Date | null = null;
        const formattedReminders = formatReminderSchedule(upcomingReminders);
        
        if (upcomingReminders.length > 0) {
          // Sort by closest first
          const sortedReminders = [...upcomingReminders].sort((a, b) => 
            a.scheduledAt.getTime() - b.scheduledAt.getTime()
          );
          
          nextReminderDate = sortedReminders[0].scheduledAt;
        }
        
        // Process the last sent reminder if available
        let lastSentAt: Date | null = null;
        let lastScheduledFor: Date | null = null;
        
        if (reminderHistory && reminderHistory.length > 0) {
          // Get the most recent reminder (they're already sorted desc)
          const lastReminder = reminderHistory[0];
          lastSentAt = new Date(lastReminder.sent_at);
          
          // Get the scheduled time if available
          if (lastReminder.scheduled_for) {
            lastScheduledFor = new Date(lastReminder.scheduled_for);
          }
        }
        
        // Format dates for display
        const formattedNextReminder = nextReminderDate 
          ? formatDistanceToNow(nextReminderDate, { addSuffix: true })
          : null;
          
        const formattedSentAt = lastSentAt
          ? formatDistanceToNow(lastSentAt, { addSuffix: false }) + " ago"
          : null;
          
        const formattedScheduledFor = lastScheduledFor
          ? formatDistanceToNow(lastScheduledFor, { addSuffix: false }) + " ago"
          : null;
        
        // Update state with all information and current timestamp
        setScheduledInfo({
          nextReminder: nextReminderDate,
          formattedNextReminder,
          lastReminder: {
            sentAt: lastSentAt,
            scheduledFor: lastScheduledFor,
            formattedSentAt,
            formattedScheduledFor
          },
          isLoading: false,
          upcomingReminders: formattedReminders,
          hasSchedule,
          lastRefreshed: Date.now()
        });
      } catch (error) {
        console.error("[useScheduledReminders] Error fetching reminder data:", error);
        setScheduledInfo(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchReminderData();
    
    // Set up a timer to refresh the formatted times
    const timer = setInterval(() => {
      setScheduledInfo(prev => {
        if (!prev.nextReminder && !prev.lastReminder.sentAt) {
          return prev; // No dates to update
        }
        
        // Update the formatted strings for display
        return {
          ...prev,
          formattedNextReminder: prev.nextReminder 
            ? formatDistanceToNow(prev.nextReminder, { addSuffix: true })
            : null,
          lastReminder: {
            ...prev.lastReminder,
            formattedSentAt: prev.lastReminder.sentAt
              ? formatDistanceToNow(prev.lastReminder.sentAt, { addSuffix: false }) + " ago"
              : null,
            formattedScheduledFor: prev.lastReminder.scheduledFor
              ? formatDistanceToNow(prev.lastReminder.scheduledFor, { addSuffix: false }) + " ago"
              : null
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
  }, [messageId, refreshTrigger, localRefreshCounter]);

  return {
    ...scheduledInfo,
    forceRefresh
  };
}
