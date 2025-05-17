
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { getReminderHistory } from "@/services/messages/reminderService";
import { migrateMessageSchedule } from "@/services/messages/reminderMigration";
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
    hasSchedule: false
  });

  useEffect(() => {
    const fetchReminderData = async () => {
      try {
        // First, try to get upcoming reminders from the new schedule system
        const upcomingReminders = await getUpcomingReminders(messageId);
        const hasSchedule = upcomingReminders.length > 0;
        
        // If no schedule exists, try to migrate this message
        if (!hasSchedule) {
          console.log(`No reminder schedule found for message ${messageId}, attempting migration`);
          const migrationSuccess = await migrateMessageSchedule(messageId);
          
          if (migrationSuccess) {
            console.log(`Successfully migrated reminder schedule for message ${messageId}`);
            // Fetch again after migration
            const migratedReminders = await getUpcomingReminders(messageId);
            if (migratedReminders.length > 0) {
              console.log(`Found ${migratedReminders.length} reminders after migration`);
            }
          }
        }
        
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
        
        // Update state with all information
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
          hasSchedule
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
