
/**
 * Utility functions for normalizing phone numbers consistently
 */

/**
 * Normalize phone number to a consistent format for internal use
 * Removes whatsapp: prefix and ensures consistent formatting
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone;
  
  // Remove whatsapp: prefix if it exists
  let normalized = phone.replace('whatsapp:', '').trim();
  
  // Ensure it starts with + for international format
  if (!normalized.startsWith('+')) {
    // Only add + if it's all digits (assuming it's missing the +)
    if (/^\d+$/.test(normalized)) {
      normalized = `+${normalized}`;
    }
  }
  
  return normalized;
}

/**
 * Create a consistent key for storing/retrieving selection states
 */
export function createSelectionKey(userId: string, phoneNumber: string): string {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const key = `${userId}-${normalizedPhone}`;
  
  console.log(`[PHONE-UTILS] Creating selection key: userId=${userId}, originalPhone=${phoneNumber}, normalizedPhone=${normalizedPhone}, key=${key}`);
  
  return key;
}

/**
 * Log phone number formats for debugging
 */
export function logPhoneDebugInfo(context: string, userId: string, phoneNumber: string) {
  console.log(`[PHONE-DEBUG] ${context}:`);
  console.log(`  - User ID: ${userId}`);
  console.log(`  - Original phone: ${phoneNumber}`);
  console.log(`  - Normalized phone: ${normalizePhoneNumber(phoneNumber)}`);
  console.log(`  - Selection key: ${createSelectionKey(userId, phoneNumber)}`);
}
