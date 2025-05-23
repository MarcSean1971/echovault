
/**
 * Format a phone number for WhatsApp usage
 * Ensures the number is in the format whatsapp:+XXXXXXXXXX
 * @param phone Phone number to format
 * @returns Properly formatted WhatsApp phone number
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remove any existing whatsapp: prefix
  let cleaned = phone.replace("whatsapp:", "").trim();
  
  // Ensure it starts with + for international format
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned.replace(/\D/g, '')}`;
  }
  
  // Return in proper WhatsApp format
  return `whatsapp:${cleaned}`;
}
