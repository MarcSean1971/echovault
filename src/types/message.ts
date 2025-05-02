
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

export type Recipient = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

// Align this with RecurringPatternSelector.tsx RecurringPatternType
export type TriggerType = 
  | 'no_check_in' 
  | 'regular_check_in' 
  | 'regular_check_in_recurring' 
  | 'group_confirmation'
  | 'panic_trigger' 
  | 'inactivity_to_recurring'
  | 'inactivity_to_date';

// Make this compatible with NoCheckInDeliveryOptions.tsx
export type DeliveryOption = 'immediately' | 'scheduled' | 'recurring' | 'once' | 'specific_date';

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
  recipients: Recipient[];
  active: boolean;
  triggered?: boolean;
  delivered?: boolean;
  trigger_date?: string;
  recurring_pattern?: RecurringPattern;
  panic_trigger_config?: PanicTriggerConfig;
  pin_code?: string;
  secondary_condition?: {
    type: TriggerType;
    hours_threshold?: number;
    trigger_date?: string;
    recurring_pattern?: RecurringPattern;
  };
  reminder_hours?: number[];
};

// Update CheckIn type to include timestamp and device_info
export type CheckIn = {
  id: string;
  user_id: string;
  timestamp: string;
  method: string;
  device_info?: string;
};
