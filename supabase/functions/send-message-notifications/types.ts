
export interface MessageNotificationRequest {
  messageId?: string; // Optional - if provided, only check this specific message
  isEmergency?: boolean; // Flag to indicate this is an emergency notification
  debug?: boolean; // Flag to enable debug mode
}

export interface Message {
  id: string;
  title: string;
  content: string | null;
  message_type: string;
  attachments: Array<{
    path: string;
    name: string;
    size: number;
    type: string;
  }> | null;
  user_id: string;
}

export interface Condition {
  id: string;
  message_id: string;
  condition_type: string;
  active: boolean;
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>;
  pin_code?: string;
  unlock_delay_hours?: number;
  expiry_hours?: number;
  trigger_date?: string;
  panic_config?: {
    keep_armed?: boolean;
    methods?: string[];
    cancel_window_seconds?: number;
    bypass_logging?: boolean;
    enabled?: boolean;
  };
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
