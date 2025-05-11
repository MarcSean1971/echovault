
import { getTwilioCredentials } from "../utils/twilio-credentials.ts";
import { formatWhatsAppNumber } from "../utils/phone-formatter.ts";

/**
 * Send WhatsApp message using Twilio API
 * Supports both regular messages and template messages
 */
export async function sendWhatsAppMessage(options: {
  to: string;
  message?: string;
  useTemplate?: boolean;
  templateId?: string;
  templateParams?: string[];
  languageCode?: string;
}) {
  try {
    const { 
      to, 
      message = '', 
      useTemplate = false, 
      templateId = '',
      templateParams = [],
      languageCode = 'en_US' 
    } = options;

    // Get Twilio credentials
    const { accountSid, authToken, twilioWhatsappNumber, messagingServiceSid } = getTwilioCredentials();

    // Format phone numbers
    const formattedTo = formatWhatsAppNumber(to);
    const formattedFrom = formatWhatsAppNumber(twilioWhatsappNumber);
    
    // Create form data for the request
    const formData = new URLSearchParams();
    
    let twilioApiUrl;
    let responseData;
    let maxRetries = 2;
    let attempt = 0;
    
    // Determine which API to use based on message type
    if (useTemplate && templateId) {
      console.log(`Sending template message to ${to} using template ID: ${templateId}`);
      
      // For templates, use the Conversations API
      twilioApiUrl = `https://conversations.twilio.com/v1/Conversations`;
      
      formData.append("To", formattedTo);
      formData.append("From", formattedFrom);
      
      // Add MessagingServiceSid which is required for template messages
      if (messagingServiceSid) {
        formData.append("MessagingServiceSid", messagingServiceSid);
      } else {
        console.warn("WARNING: MessagingServiceSid is missing - template may fail");
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
      
      console.log(`Using ContentTemplateSid: ${templateId}`);
      console.log(`Using Attributes: ${attributes}`);
    } else {
      // For standard messages using the Messages API
      console.log(`Sending standard message to ${to}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
      
      twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      
      formData.append("To", formattedTo);
      formData.append("From", formattedFrom);
      formData.append("Body", message);
    }
    
    // Make request with retry logic
    while (attempt <= maxRetries) {
      try {
        console.log(`Attempt ${attempt + 1}: Sending WhatsApp message to ${to}`);
        
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
        console.log(`Response status: ${response.status}`);
        console.log(`Response text: ${responseText}`);
        
        // Parse the response as JSON if possible
        try {
          responseData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error(`Error parsing response as JSON: ${jsonError.message}`);
          responseData = { error: true, rawResponse: responseText };
        }
        
        if (response.ok) {
          console.log(`WhatsApp message sent successfully: ${responseData.sid || 'No SID'}`);
          return {
            success: true,
            messageId: responseData.sid,
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
    
    throw new Error("Maximum retries reached, failed to send WhatsApp message");
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
