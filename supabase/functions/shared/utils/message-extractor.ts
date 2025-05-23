
/**
 * Extract WhatsApp message data from a request
 * Supports both Twilio webhook format and direct API calls
 */
export async function extractWhatsAppMessageData(req: Request): Promise<{ fromNumber: string; messageBody: string }> {
  let fromNumber: string = '';
  let messageBody: string = '';

  try {
    const contentType = req.headers.get('content-type') || '';
    
    // Handle different content types appropriately
    if (contentType.includes('application/json')) {
      // Direct API call with JSON body
      const jsonData = await req.json();
      fromNumber = jsonData.From || jsonData.from || '';
      messageBody = jsonData.Body || jsonData.body || jsonData.message || '';
      
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Standard Twilio webhook format
      const formData = await req.formData();
      fromNumber = formData.get('From')?.toString() || '';
      messageBody = formData.get('Body')?.toString() || '';
    } else {
      // Try to parse as JSON as fallback
      try {
        const text = await req.text();
        const jsonData = JSON.parse(text);
        fromNumber = jsonData.From || jsonData.from || '';
        messageBody = jsonData.Body || jsonData.body || jsonData.message || '';
      } catch (e) {
        console.error('[WEBHOOK] Could not parse request body:', e);
      }
    }

    // Clean up phone number format if needed
    if (fromNumber.startsWith('whatsapp:')) {
      fromNumber = fromNumber.replace('whatsapp:', '');
    }

    return { fromNumber, messageBody };
  } catch (error) {
    console.error('[WEBHOOK] Error extracting message data:', error);
    return { fromNumber: '', messageBody: '' };
  }
}
