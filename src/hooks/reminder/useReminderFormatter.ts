
import { formatDistanceToNow } from "date-fns";

/**
 * Simple reminder formatter for display
 */
function formatReminderSchedule(upcomingReminders: { scheduledAt: Date, reminderType: string, priority?: string }[] = []): string[] {
  const now = new Date();
  
  return upcomingReminders
    .filter(reminder => reminder.scheduledAt > now)
    .map(reminder => {
      const time = reminder.scheduledAt;
      const timeUntil = time.getTime() - now.getTime();
      const hoursUntil = Math.round(timeUntil / (1000 * 60 * 60));
      
      if (reminder.reminderType === 'final_delivery') {
        return `Final Delivery: ${time.toLocaleString()}`;
      } else {
        return `Check-in Reminder: ${hoursUntil}h (${time.toLocaleString()})`;
      }
    });
}

/**
 * Hook to format reminder data for display
 */
export function useReminderFormatter() {
  /**
   * Process and format reminder data for the UI
   */
  const formatReminderData = (
    upcomingReminders: { scheduledAt: Date, reminderType: string, priority?: string }[] = [],
    reminderHistory: any[] = []
  ) => {
    let nextReminderDate: Date | null = null;
    const formattedReminders = formatReminderSchedule(upcomingReminders);
    
    if (upcomingReminders.length > 0) {
      // Verify we have valid Date objects
      const validReminders = upcomingReminders.filter(
        reminder => reminder.scheduledAt instanceof Date && !isNaN(reminder.scheduledAt.getTime())
      );
      
      if (validReminders.length > 0) {
        // Sort by closest first
        const sortedReminders = [...validReminders].sort((a, b) => 
          a.scheduledAt.getTime() - b.scheduledAt.getTime()
        );
        
        nextReminderDate = sortedReminders[0].scheduledAt;
        console.log(`[ReminderFormatter] Next reminder scheduled for: ${nextReminderDate.toISOString()}`);
      }
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
      
      console.log(`[ReminderFormatter] Last reminder sent at: ${lastSentAt.toISOString()}`);
    }
    
    // Format dates for display
    const formattedNextReminder = nextReminderDate 
      ? formatDistanceToNow(nextReminderDate, { addSuffix: true })
      : null;
      
    const formattedSentAt = lastSentAt && !isNaN(lastSentAt.getTime())
      ? formatDistanceToNow(lastSentAt, { addSuffix: false }) + " ago"
      : null;
      
    const formattedScheduledFor = lastScheduledFor && !isNaN(lastScheduledFor.getTime())
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
      formattedNextReminder: nextReminder && !isNaN(nextReminder.getTime())
        ? formatDistanceToNow(nextReminder, { addSuffix: true })
        : null,
      lastReminderFormatted: {
        formattedSentAt: lastReminder.sentAt && !isNaN(lastReminder.sentAt.getTime())
          ? formatDistanceToNow(lastReminder.sentAt, { addSuffix: false }) + " ago"
          : null,
        formattedScheduledFor: lastReminder.scheduledFor && !isNaN(lastReminder.scheduledFor.getTime())
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
