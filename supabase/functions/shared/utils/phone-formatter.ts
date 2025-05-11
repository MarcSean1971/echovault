
/**
 * Format a phone number for WhatsApp
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
  // Remove any non-digit characters except + from the phone number
  let normalizedNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure the number starts with a +
  if (!normalizedNumber.startsWith('+')) {
    normalizedNumber = `+${normalizedNumber}`;
  }
  
  // Format for WhatsApp API: whatsapp:+{number}
  return `whatsapp:${normalizedNumber}`;
}

/**
 * Normalize a phone number to international E.164 format
 * @param phoneNumber Phone number to normalize
 * @returns Normalized phone number with + prefix
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove "whatsapp:" prefix if present
  let number = phoneNumber.replace(/^whatsapp:/, '');
  
  // Remove any non-digit characters
  number = number.replace(/[^\d+]/g, '');
  
  // Ensure number starts with +
  if (!number.startsWith('+')) {
    number = `+${number}`;
  }
  
  return number;
}
