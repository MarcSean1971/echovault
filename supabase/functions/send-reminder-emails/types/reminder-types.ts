
/**
 * Types for reminder processing
 */

export interface ReminderData {
  id: string;
  message_id: string;
  condition_id: string;
  scheduled_at: string;
  reminder_type: 'reminder' | 'final_delivery';
  status: string;
  retry_count?: number;
  delivery_priority?: 'normal' | 'high' | 'critical';
  retry_strategy?: 'standard' | 'aggressive';
}

export interface ReminderProcessingResult {
  success: boolean;
  error?: string;
  sent?: boolean;
  scheduled?: boolean;
  results?: ReminderResult[];
}

export interface ReminderResult {
  recipientId: string;
  recipientEmail: string;
  reminderType: string;
  success: boolean;
  error?: string;
  deliveryId?: string;
}

export interface MessageData {
  id: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  content?: string;
  message_type?: string;
}

export interface ConditionData {
  id: string;
  message_id: string;
  condition_type: string;
  hours_threshold?: number;
  minutes_threshold?: number;
  recipients?: any[];
  active: boolean;
  last_checked?: string;
  created_at?: string;
  updated_at?: string;
  trigger_date?: string;
  recurring_pattern?: any;
  pin_code?: string;
  panic_config?: {
    enabled: boolean;
    methods: string[];
    keep_armed: boolean;
    bypass_logging: boolean;
    trigger_keyword: string;
    cancel_window_seconds: number;
  };
  check_in_code?: string;
}

export interface ProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  backup_email?: string;
}

export interface DeliveryLogEntry {
  reminder_id: string;
  message_id: string;
  condition_id: string;
  recipient: string;
  delivery_channel: string;
  channel_order: number;
  delivery_status: 'processing' | 'delivered' | 'failed' | 'error';
  error_message?: string;
  response_data?: any;
}
