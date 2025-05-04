
// Types and interfaces for WhatsApp notifications

export interface WhatsAppMessageRequest {
  to: string;
  message: string;
  messageId?: string;
  recipientName?: string;
  isEmergency?: boolean;
  triggerKeyword?: string; 
  // Template-related fields
  useTemplate?: boolean;
  templateId?: string;
  templateParams?: string[];
}

/**
 * Normalize phone number format
 * @param phone Phone number to normalize
 * @returns Normalized phone number with proper formatting
 */
export function normalizePhoneNumber(phone: string): string {
  let normalizedPhoneNumber = phone.replace("whatsapp:", "").trim();
  if (!normalizedPhoneNumber.startsWith("+")) {
    normalizedPhoneNumber = "+" + normalizedPhoneNumber.replace(/^0/, ""); // Replace leading 0 with +
  }
  return normalizedPhoneNumber;
}

/**
 * Format phone number for WhatsApp
 * @param phone Phone number to format
 * @returns Phone number with WhatsApp prefix
 */
export function formatWhatsAppNumber(phone: string): string {
  return phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
}
