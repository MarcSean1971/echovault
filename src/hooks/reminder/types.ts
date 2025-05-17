
/**
 * Types for reminder-related hooks
 */

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
  permissionError?: boolean;
}

export interface ReminderHistoryItem {
  sent_at: string;
  scheduled_for?: string | null;
}
