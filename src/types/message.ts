export type Message = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  message_type: string;
  created_at: string;
  updated_at: string;
  attachments: Array<{
    path: string;
    name: string;
    size: number;
    type: string;
  }> | null;
  // Location fields
  location_latitude?: number | null;
  location_longitude?: number | null;
  location_name?: string | null;
  share_location?: boolean;
  // Message metadata fields
  expires_at: string | null;
  sender_name: string | null;
  // Panic trigger configuration
  panic_config?: any;
  panic_trigger_config?: any;
  // New content fields
  text_content?: string | null;
  video_content?: string | null;
};

export interface Recipient {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  notify_on_add: boolean;
}

// Align this with RecurringPatternSelector.tsx RecurringPatternType
export type TriggerType = 
  | 'no_check_in' 
  | 'regular_check_in' 
  | 'group_confirmation'
  | 'panic_trigger' 
  | 'inactivity_to_recurring'
  | 'inactivity_to_date';

// Make this compatible with NoCheckInDeliveryOptions.tsx
export type DeliveryOption = 'immediately' | 'scheduled' | 'recurring' | 'once';

// Align with RecurringPatternSelector.RecurringPattern
export type RecurringPattern = {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  day?: number;
  month?: number;
  startTime?: string;
  startDate?: string; // Added this field for start date
};

export type PanicTriggerConfig = {
  enabled: boolean;
  methods: string[];
  cancel_window_seconds: number;
  bypass_logging: boolean;
  keep_armed: boolean;
  trigger_keyword?: string; // Add trigger keyword for WhatsApp
};

export type MessageDeliveryStatus = 'armed' | 'triggered' | 'delivered' | 'viewed' | 'cancelled' | 'expired';

export type MessageCondition = {
  id: string;
  message_id: string;
  condition_type: TriggerType;
  hours_threshold: number;
  minutes_threshold?: number;
  confirmation_required?: number;
  created_at: string;
  updated_at: string;
  last_checked?: string;
  next_check?: string;
  next_reminder_at?: string; // Added this field for the next scheduled reminder
  recipients: Recipient[];
  active: boolean;
  triggered?: boolean;
  delivered?: boolean;
  trigger_date?: string;
  recurring_pattern?: RecurringPattern;
  panic_trigger_config?: PanicTriggerConfig;
  panic_config?: PanicTriggerConfig;  // Add this field to match the database structure
  pin_code?: string;
  unlock_delay_hours?: number;
  expiry_hours?: number;
  secondary_condition?: {
    type: TriggerType;
    hours_threshold?: number;
    trigger_date?: string;
    recurring_pattern?: RecurringPattern;
  };
  reminder_hours?: number[];
  check_in_code?: string; // Add the new field for custom check-in code
};

// Update Reminder type to include scheduled_for field
export type Reminder = {
  id: string;
  condition_id: string;
  message_id: string;
  user_id: string;
  sent_at: string;
  deadline: string;
  created_at: string;
  scheduled_for?: string; // Add this field for when the reminder was scheduled
};

// Update CheckIn type to include timestamp and device_info
export type CheckIn = {
  id: string;
  user_id: string;
  timestamp: string;
  method: string;
  device_info?: string;
};
