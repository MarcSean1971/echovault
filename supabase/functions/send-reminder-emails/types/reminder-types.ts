
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
    reminder_hours?: number[]; // These are actually minutes values
    // Add other condition fields as needed
  };
  hoursUntilDeadline: number;
  reminderMinutes: number[]; // Renamed for clarity - these are minutes
  matchedReminderMinute: number | null; // Renamed for clarity
}

export interface ReminderResult {
  success: boolean;
  recipient?: string;
  method?: string;
  error?: string;
}
