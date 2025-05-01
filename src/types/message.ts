
export type Message = {
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
};

export type TriggerType = 
  | 'no_check_in' 
  | 'regular_check_in'
  | 'scheduled_date'
  | 'group_confirmation'
  | 'panic_trigger';

export type RecurringPatternType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringPattern {
  type: RecurringPatternType;
  interval: number;
  day?: number;
  month?: number;
}

export type MessageCondition = {
  id: string;
  message_id: string;
  condition_type: TriggerType;
  hours_threshold?: number;
  trigger_date?: string;
  recurring_pattern?: RecurringPattern | null;
  confirmation_required?: number;
  confirmations_received?: number;
  unlock_delay_hours?: number;
  expiry_hours?: number;
  pin_code?: string;
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>;
  active: boolean;
  last_checked: string;
  created_at: string;
  updated_at: string;
};

export type Recipient = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

export type CheckIn = {
  id: string;
  user_id: string;
  timestamp: string;
  method: 'app' | 'email' | 'sms' | 'biometric';
  device_info?: string;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
};
