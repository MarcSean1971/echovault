
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
