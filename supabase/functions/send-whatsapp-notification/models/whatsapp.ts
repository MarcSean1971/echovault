
/**
 * Format a phone number to WhatsApp format
 * @param phoneNumber The raw phone number
 * @returns Formatted WhatsApp number
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
  // Remove any non-digit characters from the phone number
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  
  // Format for WhatsApp API: whatsapp:+{number}
  return `whatsapp:${normalizedNumber}`;
}

/**
 * Normalize a phone number to E.164 format
 * @param phoneNumber The raw phone number
 * @returns Normalized phone number
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Ensure the number starts with a +
  return digits.startsWith('+') ? digits : `+${digits}`;
}

/**
 * Interface for WhatsApp message request data
 */
export interface WhatsAppMessageRequest {
  /** The recipient phone number */
  to: string;
  
  /** The message text (for non-template messages) */
  message?: string;
  
  /** The ID of the parent message */
  messageId?: string;
  
  /** The recipient's name */
  recipientName?: string;
  
  /** Flag indicating if this is an emergency message */
  isEmergency?: boolean;
  
  /** Flag indicating if a template should be used */
  useTemplate?: boolean;
  
  /** The template ID to use */
  templateId?: string;
  
  /** Language code for the template (e.g. en_US) */
  languageCode?: string;
  
  /** Parameters for the template */
  templateParams?: string[];
  
  /** Optional trigger keyword to include */
  triggerKeyword?: string;
}
