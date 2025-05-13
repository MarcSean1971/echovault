
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { getNextScheduledReminder, getReminderHistory } from "@/services/messages/reminderService";

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
    isLoading: true
  });

  useEffect(() => {
    const fetchReminderData = async () => {
      try {
        // Get the next scheduled reminder
        const nextReminder = await getNextScheduledReminder(messageId);
        
        // Get reminder history
        const reminderHistory = await getReminderHistory(messageId);
        
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
        
        // Format the dates for display
        const formattedNextReminder = nextReminder 
          ? formatDistanceToNow(nextReminder, { addSuffix: true })
          : null;
          
        const formattedSentAt = lastSentAt
          ? formatDistanceToNow(lastSentAt, { addSuffix: false }) + " ago"
          : null;
          
        const formattedScheduledFor = lastScheduledFor
          ? formatDistanceToNow(lastScheduledFor, { addSuffix: false }) + " ago"
          : null;
        
        // Update the state with all the information
        setScheduledInfo({
          nextReminder,
          formattedNextReminder,
          lastReminder: {
            sentAt: lastSentAt,
            scheduledFor: lastScheduledFor,
            formattedSentAt,
            formattedScheduledFor
          },
          isLoading: false
        });
      } catch (error) {
        console.error("Error in useScheduledReminders:", error);
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
    
    return () => clearInterval(timer);
  }, [messageId, refreshTrigger]);

  return scheduledInfo;
}
