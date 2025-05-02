
export interface Message {
  id: string;
  title: string;
  content: string | null;
  message_type: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  attachments?: Array<{
    path: string;
    name: string;
    size: number;
    type: string;
  }> | null;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Condition {
  id: string;
  message_id: string;
  condition_type: string;
  recipients: Recipient[];
  pin_code?: string | null;
  unlock_delay_hours?: number;
  expiry_hours?: number;
  panic_config?: {
    enabled?: boolean;
    methods?: string[];
    cancel_window_seconds?: number;
    bypass_logging?: boolean;
    keep_armed?: boolean;
  };
}

export interface MessageNotificationRequest {
  messageId?: string;
  isEmergency?: boolean;
  debug?: boolean;
  keepArmed?: boolean;
}

export interface EmailTemplateData {
  senderName: string;
  messageTitle: string;
  recipientName: string;
  messageType: string;
  hasPinCode: boolean;
  hasDelayedAccess: boolean;
  hasExpiry: boolean;
  unlockDate: string | null;
  expiryDate: string | null;
  accessUrl: string;
  isEmergency?: boolean;
}
