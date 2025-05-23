
/**
 * Types for the reminder system
 */

export interface ReminderData {
  id: string;
  message_id: string;
  condition_id: string;
  scheduled_at: string;
  reminder_type: 'reminder' | 'final_delivery';
  status: 'pending' | 'processing' | 'sent' | 'failed';
  retry_count: number;
  last_attempt_at?: string;
  delivery_priority: 'normal' | 'high' | 'critical';
  retry_strategy: 'standard' | 'aggressive';
  created_at: string;
  updated_at: string;
}

export interface ReminderProcessingResult {
  success: boolean;
  error?: string;
  sent?: boolean;
  results?: Array<{
    success: boolean;
    recipient: string;
    channel: string;
    messageId?: string;
    error?: string;
  }>;
  details?: any;
}

export interface ReminderSystemStats {
  pendingReminders: number;
  processedReminders: number;
  sentReminders: number;
  failedReminders: number;
  nextScheduledReminder?: string;
}

export interface RecipientReminderData {
  name: string;
  email: string;
  phone?: string;
  firstName?: string;
  deliveryId?: string;
}

export interface WhatsAppSendOptions {
  timeUntilDeadline: string;
  appUrl: string;
  debug?: boolean;
  isTest?: boolean;
  isFinalDelivery?: boolean;
}
