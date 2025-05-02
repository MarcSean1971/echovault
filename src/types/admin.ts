
export interface AdminMessage {
  id: string;
  title: string;
  sender: string;
  recipients: string[];
  status: string;
  condition: string;
  createdAt: string;
}

export interface MessageFilter {
  search: string;
  status: string;
}
