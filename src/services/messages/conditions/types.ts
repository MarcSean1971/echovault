
import { MessageCondition, TriggerType, RecurringPattern, PanicTriggerConfig } from "@/types/message";

export interface CreateConditionOptions {
  // Basic options
  hoursThreshold?: number;
  minutesThreshold?: number;
  confirmationRequired?: number;
  triggerDate?: string;
  recurringPattern?: RecurringPattern | null;
  
  // Recipients
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>;
  
  // Advanced options
  pinCode?: string;
  unlockDelayHours?: number;
  expiryHours?: number;
  
  // Enhanced trigger options
  secondaryConditionType?: TriggerType;
  secondaryTriggerDate?: string;
  secondaryRecurringPattern?: RecurringPattern | null;
  reminderHours?: number[];
  panicTriggerConfig?: PanicTriggerConfig;
  
  // Custom check-in code
  checkInCode?: string;
}

export interface CheckInResult {
  success: boolean;
  timestamp: string;
  method: string;
  conditions_updated: number;
}

export interface CheckInDeadlineResult {
  deadline: Date;
  conditions: MessageCondition[];
}

export interface PanicTriggerResult {
  success: boolean;
  message: string;
  triggered_at: string;
  keepArmed?: boolean;
  duplicate?: boolean; // Added this property to fix the TypeScript error
}

export interface MessageStatusResult {
  id: string;
  message_id: string;
  status: string;
  active: boolean;
  condition_type: string;
}
