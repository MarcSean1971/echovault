
export interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  deliveryId?: string;
}

export interface Message {
  id: string;
  title: string;
  content: string | null;
  user_id: string;
  message_type: string;
}

export interface Condition {
  id: string;
  message_id: string;
  active: boolean;
  condition_type: string;
  recipients: Recipient[];
  trigger_date?: string;
  reminder_hours?: number[];
}

export interface ReminderData {
  message: Message;
  condition: Condition;
  hoursUntilDeadline: number;
  reminderHours: number[];
}

export interface ReminderResult {
  success: boolean;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  method?: string;
  error?: string;
}

export interface MessageInfo {
  id: string;
  title: string;
  deadline: string;
  hoursUntil: number;
}
