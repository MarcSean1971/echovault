
/**
 * Extract WhatsApp message data from webhook request
 * Support both direct JSON payload and form data from Twilio
 */
export async function extractWhatsAppMessageData(req: Request) {
  try {
    // Try to parse as JSON first (for API requests)
    try {
      const jsonData = await req.clone().json();
      
      if (jsonData.Body && jsonData.From) {
        return {
          fromNumber: jsonData.From.replace('whatsapp:', ''),
          messageBody: jsonData.Body
        };
      }
    } catch (e) {
      // Not JSON, might be form data
    }
    
    // Try to parse as form data (from Twilio webhook)
    const formData = await req.formData();
    
    const fromNumber = formData.get('From')?.toString().replace('whatsapp:', '') || '';
    const messageBody = formData.get('Body')?.toString() || '';
    
    return { fromNumber, messageBody };
  } catch (error) {
    console.error("Error extracting WhatsApp message data:", error);
    return { fromNumber: '', messageBody: '' };
  }
}
