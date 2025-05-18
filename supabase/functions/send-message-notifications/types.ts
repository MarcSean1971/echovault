
export interface MessageNotificationRequest {
  messageId?: string;
  debug?: boolean;
  isEmergency?: boolean;
  forceSend?: boolean;
  keepArmed?: boolean;
  source?: string;
  testMode?: boolean; // New parameter
}

export interface EmailTemplateData {
  accessUrl: string;
  recipientName: string | null;
  senderName: string;
  messageTitle: string;
  messageContent?: string | null;
  shareLocation?: boolean;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  locationName?: string | null;
  isEmergency?: boolean;
  attachments?: Array<{
    path: string;
    name: string;
    size: number;
    type: string;
  }> | null;
}
