
export type MessageType = "text" | "audio" | "video";

export type TriggerType = "no_check_in" | "panic_button" | "manual_trigger" | "scheduled" | "panic_trigger";
export type DeliveryOption = "immediate" | "once" | "recurring";
export type RecurringPatternType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringPattern {
  type: RecurringPatternType;
  interval: number;
  day?: number;
  month?: number;
}

export interface PanicTriggerConfig {
  enabled: boolean;
  methods: string[];
  cancel_window_seconds: number;
  bypass_logging: boolean;
  keep_armed: boolean;
  trigger_keyword?: string;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  notes?: string;
  deliveryId?: string;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  message_type: MessageType;
  user_id: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  expires_in_hours?: number;
  is_armed?: boolean;
  sender_name?: string;
  share_location?: boolean;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  location_latitude?: number;
  location_longitude?: number;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url: string;
  created_at: string;
  path?: string;
  name?: string;
  size?: number;
  type?: string;
}

export interface FileAttachment {
  file: File;
  id?: string;
  preview?: string;
  name: string;
  size: number;
  type?: string;
  lastModified?: number;
  path?: string;
  url?: string;
  isUploaded?: boolean;
  uploading?: boolean;
  progress?: number;
}

export type MessageDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'armed' | 'triggered' | 'viewed' | 'cancelled' | 'expired';

export interface MessageCondition {
  id: string;
  message_id: string;
  trigger_type: TriggerType;
  condition_type?: string;
  hours_threshold?: number;
  minutes_threshold?: number;
  trigger_date?: string;
  recurring_pattern?: RecurringPattern;
  delivery_option?: DeliveryOption;
  reminder_hours?: number[];
  active?: boolean;
  created_at: string;
  updated_at: string;
  last_check_in?: string;
  next_deadline?: string;
  pin_code?: string;
  unlock_delay_hours?: number;
  expiry_hours?: number;
  panic_trigger_config?: PanicTriggerConfig;
  panic_config?: PanicTriggerConfig;
  check_in_code?: string;
  recipients?: Recipient[];
  triggered?: boolean;
  delivered?: boolean;
  confirmation_required?: number;
  last_checked?: string;
}

export interface DeliveredMessage {
  id: string;
  message_id: string;
  recipient_id: string;
  delivery_id: string;
  sent_at: string;
  opened_at?: string;
  recipient_email: string;
  recipient_name?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}
