
/**
 * Format a phone number for WhatsApp usage
 * @param phone Phone number to format
 * @returns Formatted phone number for WhatsApp API
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remove any existing whatsapp: prefix
  let cleaned = phone.replace("whatsapp:", "").trim();
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned.replace(/\D/g, '')}`;
  }
  
  // Return in proper WhatsApp format
  return `whatsapp:${cleaned}`;
}
