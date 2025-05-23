
// Common CORS headers for all WhatsApp functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create a standardized error response
export function createErrorResponse(message: string | Error, status: number = 400): Response {
  const errorMessage = message instanceof Error ? message.message : message;
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage
    }),
    {
      status: status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

// Helper function to create a standardized success response
export function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

// Helper function to send WhatsApp messages
export async function sendWhatsAppMessage(options: {
  to: string;
  message?: string;
  useTemplate?: boolean;
  templateId?: string;
  templateParams?: string[];
  languageCode?: string;
  messageId?: string;  // Optional message ID to track
  debug?: boolean;     // Enable debug logging
}) {
  try {
    const { 
      to, 
      message = '', 
      useTemplate = false, 
      templateId = '',
      templateParams = [],
      languageCode = 'en_US',
      messageId = '',
      debug = false
    } = options;
    
    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');
    const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');
    
    if (!accountSid || !authToken || !twilioWhatsappNumber) {
      console.error("Missing Twilio credentials");
      throw new Error("Missing Twilio credentials");
    }
    
    // Format phone numbers
    const formattedTo = formatWhatsAppNumber(to);
    const formattedFrom = formatWhatsAppNumber(twilioWhatsappNumber);
    
    if (debug) {
      console.log(`Sending WhatsApp ${useTemplate ? 'template' : 'message'} to ${formattedTo}`);
      if (useTemplate) console.log(`Using template ID: ${templateId}`);
    }
    
    // Create form data for the request
    const formData = new URLSearchParams();
    
    let twilioApiUrl;
    let responseData;
    
    // Determine which API to use based on message type
    if (useTemplate && templateId) {
      // For templates, use the Conversations API
      twilioApiUrl = `https://conversations.twilio.com/v1/Conversations`;
      
      formData.append("To", formattedTo);
      formData.append("From", formattedFrom);
      
      // Add MessagingServiceSid which is required for template messages
      if (messagingServiceSid) {
        formData.append("MessagingServiceSid", messagingServiceSid);
      }
      
      // Use ContentTemplateSid for the approved template ID
      formData.append("ContentTemplateSid", templateId);
      
      // Create template variables in the format Twilio Conversations API expects
      const parameters: Record<string, string> = {};
      templateParams.forEach((param, index) => {
        parameters[`${index+1}`] = param;
      });
      
      // Add parameters as a JSON string in the Attributes field
      const attributes = JSON.stringify({
        parameters: parameters,
        language: languageCode
      });
      
      formData.append("Attributes", attributes);
      
      if (debug) {
        console.log(`Using ContentTemplateSid: ${templateId}`);
        console.log(`Using Attributes: ${attributes}`);
        console.log(`Template parameters:`, templateParams);
      }
    } else {
      // For standard messages using the Messages API
      twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      
      formData.append("To", formattedTo);
      formData.append("From", formattedFrom);
      formData.append("Body", message);
      
      if (debug) {
        console.log(`Message text: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
      }
    }
    
    // Make request with retry logic
    let maxRetries = 2;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        if (debug) console.log(`Attempt ${attempt + 1}: Sending WhatsApp message to ${formattedTo}`);
        
        const response = await fetch(twilioApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });
        
        // Get the response text
        const responseText = await response.text();
        
        if (debug) {
          console.log(`Response status: ${response.status}`);
          console.log(`Response text: ${responseText.substring(0, 500)}`);
        }
        
        // Parse the response as JSON if possible
        try {
          responseData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error(`Error parsing response as JSON: ${jsonError.message}`);
          responseData = { error: true, rawResponse: responseText };
        }
        
        if (response.ok) {
          if (debug) console.log(`WhatsApp message sent successfully: ${responseData.sid || responseData.sid || 'No SID'}`);
          
          return {
            success: true,
            messageId: responseData.sid || responseData.sid,
            status: useTemplate ? responseData.state : responseData.status,
            usingTemplate: useTemplate,
            templateId: useTemplate ? templateId : null
          };
        } else {
          // Get detailed error information
          let errorMessage = "Unknown error";
          if (responseData && responseData.message) {
            errorMessage = responseData.message;
          } else if (responseData && responseData.error_message) {
            errorMessage = responseData.error_message;
          }
          
          throw new Error(`Twilio API error: ${errorMessage}`);
        }
      } catch (error) {
        attempt++;
        console.error(`Twilio API error (attempt ${attempt}/${maxRetries + 1}):`, error);
        
        if (attempt > maxRetries) {
          throw error; // Re-throw after max retries
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error("Maximum retries reached");
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Format a phone number for WhatsApp usage
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
