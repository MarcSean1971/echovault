import { formatDistanceToNow } from "date-fns";
import { formatReminderSchedule } from "@/utils/reminder/reminderFormatter";

/**
 * Hook to format reminder data for display
 */
export function useReminderFormatter() {
  /**
   * Process and format reminder data for the UI
   */
  const formatReminderData = (
    upcomingReminders: any[] = [],
    reminderHistory: any[] = []
  ) => {
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
      
    return {
      nextReminder: nextReminderDate,
      formattedNextReminder,
      lastReminder: {
        sentAt: lastSentAt,
        scheduledFor: lastScheduledFor,
        formattedSentAt,
        formattedScheduledFor
      },
      upcomingReminders: formattedReminders,
      hasSchedule: upcomingReminders.length > 0
    };
  };
  
  /**
   * Update formatted times for existing data
   */
  const refreshFormattedTimes = (existingData: {
    nextReminder: Date | null;
    lastReminder: {
      sentAt: Date | null;
      scheduledFor: Date | null;
    };
  }) => {
    const { nextReminder, lastReminder } = existingData;
    
    return {
      formattedNextReminder: nextReminder 
        ? formatDistanceToNow(nextReminder, { addSuffix: true })
        : null,
      lastReminderFormatted: {
        formattedSentAt: lastReminder.sentAt
          ? formatDistanceToNow(lastReminder.sentAt, { addSuffix: false }) + " ago"
          : null,
        formattedScheduledFor: lastReminder.scheduledFor
          ? formatDistanceToNow(lastReminder.scheduledFor, { addSuffix: false }) + " ago"
          : null
      }
    };
  };
  
  return {
    formatReminderData,
    refreshFormattedTimes
  };
}
