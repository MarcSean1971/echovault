
export type MessageType = "text";

export type TriggerType = "no_check_in" | "panic_button" | "manual_trigger" | "scheduled";
export type DeliveryOption = "immediate" | "recurring";
export type RecurringPattern = "daily" | "weekly" | "monthly" | null;

export interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  notes?: string;
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
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url: string;
  created_at: string;
}

export interface FileAttachment extends File {
  file: File;
  id?: string;
  preview?: string;
}

export interface MessageCondition {
  id: string;
  message_id: string;
  trigger_type: TriggerType;
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
  panic_trigger_config?: any;
  check_in_code?: string;
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
