
/**
 * Format a phone number for WhatsApp usage
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "";
  
  // Remove any existing whatsapp: prefix
  let cleaned = phone.replace("whatsapp:", "").trim();
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned.replace(/\D/g, '')}`;
  }
  
  // Return in proper WhatsApp format for Twilio
  return `whatsapp:${cleaned}`;
}

/**
 * Format a phone number to standard E.164 format
 */
export function formatE164PhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // Remove any non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }
  
  return cleaned;
}
