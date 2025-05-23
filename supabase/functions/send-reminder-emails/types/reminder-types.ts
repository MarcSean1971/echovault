
/**
 * Interface for a scheduled reminder
 */
export interface ReminderData {
  id: string;
  message_id: string;
  condition_id: string;
  scheduled_at: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  reminder_type: string;
  delivery_priority?: string;
  retry_count?: number;
  last_attempt_at?: string;
}
