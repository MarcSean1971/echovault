
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

// Re-adding these types to fix type errors
export type TriggerType = 
  | 'no_check_in' 
  | 'regular_check_in' 
  | 'regular_check_in_recurring' 
  | 'group_confirmation'
  | 'panic_trigger' 
  | 'inactivity_to_recurring'
  | 'inactivity_to_date';

export type DeliveryOption = 'immediately' | 'scheduled' | 'recurring';

export type RecurringPattern = {
  type: 'day' | 'week' | 'month';
  interval: number;
  days?: number[];
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

export type CheckIn = {
  id: string;
  user_id: string;
  checked_in_at: string;
  method: string;
};
