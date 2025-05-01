
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

export type MessageCondition = {
  id: string;
  message_id: string;
  condition_type: 'no_check_in' | 'regular_check_in';
  hours_threshold: number;
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
