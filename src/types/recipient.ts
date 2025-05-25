
export interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_id?: string;
  notify_on_add?: boolean;
  created_at?: string;
  updated_at?: string;
}
