
/**
 * Format location information for WhatsApp messages
 * @param message Message object containing location data
 * @returns Formatted location info and map URL
 */
export function formatLocationInfo(message: any) {
  let locationInfo = "Test location";
  let mapUrl = "https://maps.example.com";
  
  if (message?.share_location && message?.location_latitude && message?.location_longitude) {
    locationInfo = message.location_name || `${message.location_latitude}, ${message.location_longitude}`;
    mapUrl = `https://maps.google.com/?q=${message.location_latitude},${message.location_longitude}`;
  }
  
  return { locationInfo, mapUrl };
}

/**
 * Format a phone number for proper WhatsApp usage
 * @param phone Raw phone number
 * @returns Properly formatted phone number with country code
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any whatsapp: prefix if it exists
  const formattedPhone = phone.replace("whatsapp:", "");
  
  // Ensure it starts with a + for international format
  const cleanPhone = formattedPhone.startsWith('+') ? 
    formattedPhone : 
    `+${formattedPhone.replace(/\D/g, '')}`;
    
  return cleanPhone;
}
