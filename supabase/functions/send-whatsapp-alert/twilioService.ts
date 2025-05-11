
/**
 * Service for handling Twilio WhatsApp template and fallback message sending
 */

/**
 * Get Twilio credentials from environment variables
 * @returns Object containing required Twilio credentials
 * @throws Error if any required credentials are missing
 */
export function getTwilioCredentials() {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
  
  if (!accountSid || !authToken || !messagingServiceSid) {
    throw new Error("Missing required Twilio credentials");
  }
  
  return { accountSid, authToken, messagingServiceSid };
}

/**
 * Format the recipient's phone number for WhatsApp
 * @param phoneNumber Phone number to format
 * @returns Formatted phone number for WhatsApp API
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
  let formattedNumber = phoneNumber;
  
  // Add WhatsApp prefix if not present
  if (!formattedNumber.startsWith("whatsapp:")) {
    formattedNumber = `whatsapp:${formattedNumber}`;
  }
  
  return formattedNumber;
}

/**
 * Send a WhatsApp template message
 * @param options Message options
 * @returns Response from Twilio API
 */
export async function sendTemplateMessage(options: {
  to: string;
  from: string;
  templateSid: string;
  languageCode: string;
  parameters: Record<string, string>;
}) {
  const { accountSid, authToken, messagingServiceSid } = getTwilioCredentials();
  const { to, from, templateSid, languageCode, parameters } = options;
  
  // Format the recipient number if needed
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  
  // Create the payload with explicit language information
  const payload = new URLSearchParams({
    MessagingServiceSid: messagingServiceSid,
    To: formattedTo,
    From: from,
    ContentTemplateSid: templateSid,
    Attributes: JSON.stringify({
      parameters,
      language: languageCode
    })
  });
  
  console.log("Template request parameters:");
  payload.forEach((value, key) => {
    if (key === "Attributes") {
      console.log(`  ${key}: ${value}`); // Log full attributes for debugging
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });
  
  // Send the request to Twilio
  const response = await fetch("https://conversations.twilio.com/v1/Conversations", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: payload
  });
  
  // Get the response
  const responseText = await response.text();
  console.log(`Response status: ${response.status}`);
  console.log(`Response: ${responseText}`);
  
  // Parse the JSON response
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch (error) {
    console.error("Error parsing response:", error);
    responseData = { rawResponse: responseText };
  }
  
  return { response, responseData };
}

/**
 * Send a standard WhatsApp message (fallback)
 * @param options Message options
 * @returns Response from Twilio API
 */
export async function sendStandardMessage(options: {
  to: string;
  from: string;
  message: string;
}) {
  const { accountSid, authToken } = getTwilioCredentials();
  const { to, from, message } = options;
  
  // Format the recipient number if needed
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  
  // Create fallback payload for standard message
  const payload = new URLSearchParams({
    To: formattedTo,
    From: from,
    Body: message
  });
  
  console.log("Fallback request parameters:");
  payload.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });
  
  // Send fallback message
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: payload
  });
  
  const responseText = await response.text();
  console.log(`Fallback response status: ${response.status}`);
  console.log(`Fallback response: ${responseText}`);
  
  try {
    return { 
      response,
      responseData: JSON.parse(responseText) 
    };
  } catch (error) {
    console.error("Error parsing fallback response:", error);
    return { 
      response,
      responseData: { rawResponse: responseText } 
    };
  }
}
