
// WhatsApp/Twilio utility functions for consistent message handling

/**
 * Standard CORS headers for cross-origin requests
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Format a phone number to proper WhatsApp format
 * @param phoneNumber The phone number to format
 * @returns Properly formatted WhatsApp phone number
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
  if (!phoneNumber) return "";
  
  // Remove any existing "whatsapp:" prefix
  let normalizedNumber = phoneNumber.replace("whatsapp:", "");
  
  // Ensure it has a + prefix for international format
  if (!normalizedNumber.startsWith("+")) {
    normalizedNumber = "+" + normalizedNumber.replace(/\D/g, "");
  }
  
  // Add "whatsapp:" prefix required by Twilio
  return `whatsapp:${normalizedNumber}`;
}

/**
 * Get Twilio credentials from environment variables
 */
export function getTwilioCredentials() {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioWhatsappNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "+14155238886";
  const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

  if (!accountSid || !authToken) {
    throw new Error("Missing required Twilio credentials");
  }
  
  return { 
    accountSid, 
    authToken, 
    twilioWhatsappNumber: formatWhatsAppNumber(twilioWhatsappNumber),
    messagingServiceSid 
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: any, status: number = 500) {
  console.error("WhatsApp error:", error);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message || "Unknown error occurred",
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    }
  );
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    }
  );
}

/**
 * Extract phone number and message body from webhook request
 */
export async function extractWhatsAppMessageData(req: Request): Promise<{ fromNumber: string; messageBody: string }> {
  let fromNumber = "";
  let messageBody = "";
  
  const contentType = req.headers.get("content-type") || "";
  
  try {
    if (contentType.includes("application/json")) {
      const jsonData = await req.json();
      fromNumber = jsonData.From || jsonData.from || "";
      messageBody = jsonData.Body || jsonData.body || "";
    } 
    else if (contentType.includes("application/x-www-form-urlencoded") || 
             contentType.includes("multipart/form-data")) {
      try {
        const formData = await req.formData();
        fromNumber = formData.get("From")?.toString() || "";
        messageBody = formData.get("Body")?.toString() || "";
      } catch {
        const rawBody = await req.text();
        const params = new URLSearchParams(rawBody);
        fromNumber = params.get("From") || "";
        messageBody = params.get("Body") || "";
      }
    } 
    else {
      const rawText = await req.text();
      try {
        const maybeJson = JSON.parse(rawText);
        fromNumber = maybeJson.From || maybeJson.from || "";
        messageBody = maybeJson.Body || maybeJson.body || "";
      } catch {
        const params = new URLSearchParams(rawText);
        fromNumber = params.get("From") || "";
        messageBody = params.get("Body") || "";
      }
    }
    
    // Clean up phone number (remove whatsapp: prefix)
    fromNumber = fromNumber.replace("whatsapp:", "");
    
    return { fromNumber, messageBody };
  } catch (error) {
    console.error("Error extracting WhatsApp message data:", error);
    throw new Error("Failed to extract message data from request");
  }
}

/**
 * Send a WhatsApp message using Twilio API
 */
export async function sendWhatsAppMessage(options: {
  to: string;
  message?: string;
  useTemplate?: boolean;
  templateId?: string;
  templateParams?: Record<string, string>;
  languageCode?: string;
}) {
  const { accountSid, authToken, twilioWhatsappNumber } = getTwilioCredentials();
  const { to, message, useTemplate, templateId, templateParams, languageCode = "en_US" } = options;
  
  // Format the recipient number
  const formattedTo = formatWhatsAppNumber(to);
  
  try {
    if (useTemplate && templateId) {
      return await sendWhatsAppTemplate({
        to: formattedTo,
        templateId,
        templateParams,
        languageCode,
        accountSid,
        authToken,
        from: twilioWhatsappNumber
      });
    } else {
      return await sendWhatsAppDirectMessage({
        to: formattedTo, 
        body: message || "Test message",
        accountSid,
        authToken,
        from: twilioWhatsappNumber
      });
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}

/**
 * Send a direct WhatsApp message
 */
async function sendWhatsAppDirectMessage(options: {
  to: string;
  body: string;
  accountSid: string;
  authToken: string;
  from: string;
}) {
  const { to, body, accountSid, authToken, from } = options;
  
  const formData = new URLSearchParams({
    To: to,
    From: from,
    Body: body
  });
  
  console.log(`Sending direct WhatsApp message to ${to}`);
  
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });
  
  const responseText = await response.text();
  
  if (!response.ok) {
    console.error(`Twilio error: ${responseText}`);
    throw new Error(`Twilio API error: ${responseText}`);
  }
  
  try {
    return JSON.parse(responseText);
  } catch {
    return { sid: "unknown", status: "sent", rawResponse: responseText };
  }
}

/**
 * Send a WhatsApp template message
 */
async function sendWhatsAppTemplate(options: {
  to: string;
  templateId: string;
  templateParams?: Record<string, string>;
  languageCode?: string;
  accountSid: string;
  authToken: string;
  from: string;
}) {
  const { to, templateId, templateParams, languageCode = "en_US", accountSid, authToken, from } = options;
  const { messagingServiceSid } = getTwilioCredentials();
  
  if (!messagingServiceSid) {
    console.warn("Missing TWILIO_MESSAGING_SERVICE_SID. Template may fail.");
  }
  
  // Create parameters formatted for Twilio API
  const parameters: Record<string, string> = {};
  if (templateParams) {
    Object.keys(templateParams).forEach((key, index) => {
      parameters[`${index+1}`] = templateParams[key];
    });
  }
  
  const formData = new URLSearchParams({
    MessagingServiceSid: messagingServiceSid || "",
    To: to,
    From: from,
    ContentTemplateSid: templateId,
    Attributes: JSON.stringify({
      parameters,
      language: languageCode
    })
  });
  
  console.log(`Sending template message to ${to} using template ${templateId}`);
  
  // Templates use Conversations API
  const response = await fetch("https://conversations.twilio.com/v1/Conversations", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });
  
  const responseText = await response.text();
  
  if (!response.ok) {
    console.error(`Twilio template error: ${responseText}`);
    throw new Error(`Twilio template error: ${responseText}`);
  }
  
  try {
    return JSON.parse(responseText);
  } catch {
    return { sid: "unknown", status: "sent", rawResponse: responseText };
  }
}
