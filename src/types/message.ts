
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
  | 'no_check_in'           // Inactivity-based (dead man's switch)
  | 'regular_check_in'      // Regular check-in required
  | 'regular_check_in_recurring' // Regular check-in with recurring reminders
  | 'group_confirmation'    // Group confirmation required
  | 'panic_trigger'         // Manual panic trigger
  | 'inactivity_to_recurring' // Inactivity → Then Recurring
  | 'inactivity_to_date';    // Inactivity → Then Specific Date

export type DeliveryOption = "once" | "recurring" | "specific_date";

export type RecurringPatternType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringPattern {
  type: RecurringPatternType;
  interval: number;
  day?: number;
  month?: number;
  startTime?: string; // For specifying time of day
}

export type MessageCondition = {
  id: string;
  message_id: string;
  condition_type: TriggerType;
  
  // Inactivity settings
  hours_threshold?: number;
  minutes_threshold?: number; // New: minutes threshold
  
  // Date-based settings
  trigger_date?: string;
  recurring_pattern?: RecurringPattern | null;
  
  // Group confirmation settings
  confirmation_required?: number;
  confirmations_received?: number;
  
  // Security and access settings
  unlock_delay_hours?: number;
  expiry_hours?: number;
  pin_code?: string;
  
  // Combined trigger settings
  secondary_condition_type?: TriggerType;
  secondary_trigger_date?: string;
  secondary_recurring_pattern?: RecurringPattern | null;
  
  // Reminder settings
  reminder_hours?: number[];
  
  // Delivery option for no_check_in
  delivery_option?: DeliveryOption;
  
  // Last message sent (for recurring patterns)
  last_message_sent?: string;
  next_message_scheduled?: string;
  
  // Recipients
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>;
  
  // Status
  active: boolean;
  triggered?: boolean;
  delivered?: boolean;
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

// Message status tracking
export type MessageDeliveryStatus = 
  | 'armed'       // Message is active but not triggered
  | 'triggered'   // Trigger condition met
  | 'sending'     // In process of delivery
  | 'delivered'   // Successfully delivered
  | 'viewed'      // Recipient has viewed the message
  | 'unlocked'    // Recipient has unlocked the content (if delayed)
  | 'expired'     // Message has expired
  | 'failed'      // Delivery failed
  | 'cancelled';  // Message was cancelled before delivery

export type RecipientInteraction = {
  recipient_id: string;
  message_id: string;
  status: 'delivered' | 'viewed' | 'unlocked';
  timestamp: string;
};

// Panic trigger configuration
export type PanicTriggerConfig = {
  enabled: boolean;
  methods: Array<'app' | 'sms' | 'email'>;
  cancel_window_seconds: number;
  bypass_logging: boolean;
  sms_keyword?: string;
  sms_number?: string;
};
