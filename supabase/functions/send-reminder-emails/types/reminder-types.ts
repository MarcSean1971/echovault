
export interface ReminderData {
  message: {
    id: string;
    title: string;
    content: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    message_type: string;
    // Add other message fields as needed
  };
  condition: {
    id: string;
    message_id: string;
    active: boolean;
    condition_type: string;
    recipients: Array<{
      id: string;
      name: string;
      email: string;
      phone?: string;
    }>;
    trigger_date?: string;
    reminder_hours?: number[];
    // Add other condition fields as needed
  };
  hoursUntilDeadline: number;
  reminderHours: number[];
  matchedReminderHour: number | null;
}

export interface ReminderResult {
  success: boolean;
  recipient?: string;
  method?: string;
  error?: string;
}
