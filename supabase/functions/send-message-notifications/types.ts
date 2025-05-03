
/**
 * Request format for message notifications
 */
export interface MessageNotificationRequest {
  messageId?: string;
  isEmergency?: boolean;
  debug?: boolean;
  keepArmed?: boolean;
}

/**
 * Message data structure
 */
export interface Message {
  id: string;
  user_id: string;
  title: string;
  content: string;
  message_type: string;
  created_at: string;
  updated_at: string;
  share_location?: boolean;
  location_latitude?: number | null;
  location_longitude?: number | null;
  location_name?: string | null;
}

/**
 * Condition data structure
 */
export interface Condition {
  id: string;
  message_id: string;
  condition_type: string;
  hours_threshold: number;
  minutes_threshold?: number;
  confirmation_required?: number;
  created_at: string;
  updated_at: string;
  last_checked?: string;
  next_check?: string;
  recipients: any[];
  active: boolean;
  triggered?: boolean;
  delivered?: boolean;
  trigger_date?: string;
  recurring_pattern?: any;
  panic_config?: any;
  panic_trigger_config?: any;
}

/**
 * Email template data structure
 */
export interface EmailTemplateData {
  accessUrl: string;
  recipientName: string | null;
  senderName: string;
  messageTitle: string;
  messageContent?: string | null;
  isEmergency?: boolean;
  shareLocation?: boolean;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  locationName?: string | null;
}

