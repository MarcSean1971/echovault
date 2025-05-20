
export interface MessageDetails {
  id: string;
  title: string;
  content: string | null;
  attachments: any[] | null;
  recipientCount: number;
}
