
/**
 * Type definitions for the reminder service
 */

export interface Reminder {
  id: string;
  message_id: string;
  condition_id: string;
  sent_at: string;
  deadline: string;
  scheduled_for?: string | null;
  user_id?: string;
}

export interface ReminderScheduleParams {
  messageId: string;
  conditionId: string;
  conditionType: string;
  triggerDate: string | null;
  reminderMinutes: number[];
  lastChecked: string | null;
  hoursThreshold?: number;
  minutesThreshold?: number;
}

export interface ReminderResult {
  success: boolean;
  message?: string;
  error?: string;
}
