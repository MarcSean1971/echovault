
import { formatWhatsAppNumber, normalizePhoneNumber, WhatsAppMessageRequest } from "../models/whatsapp.ts";
import { getTwilioCredentials } from "../utils/env.ts";

/**
 * Build message form data for Twilio API
 * @param requestData The WhatsApp message request data
 * @returns FormData ready to send to Twilio API
 */
export function buildMessageFormData(requestData: WhatsAppMessageRequest): URLSearchParams {
  const { twilioWhatsappNumber, messagingServiceSid } = getTwilioCredentials();
  const { 
    to, 
    message, 
    recipientName,
    useTemplate = false,
    templateId = '',
    templateParams = [],
    languageCode = 'en_US' // Default language code for templates
  } = requestData;
  
  // Process phone number to ensure consistency
  const normalizedPhoneNumber = normalizePhoneNumber(to);
  
  // Format the WhatsApp numbers correctly
  const formattedTo = formatWhatsAppNumber(normalizedPhoneNumber);
  const formattedFrom = formatWhatsAppNumber(twilioWhatsappNumber);
  
  // Create form data for the request
  const formData = new URLSearchParams();
  
  if (useTemplate && templateId) {
    console.log(`Using Conversations API with template ID: ${templateId}, language: ${languageCode}`);
    
    // For templates, we need to use the Conversations API with different parameters
    formData.append("To", formattedTo);
    formData.append("From", formattedFrom);
    
    // Add MessagingServiceSid which is required for template messages
    if (messagingServiceSid) {
      formData.append("MessagingServiceSid", messagingServiceSid);
      console.log(`Using MessagingServiceSid: ${messagingServiceSid}`);
    } else {
      console.warn("WARNING: MessagingServiceSid is missing - template may fail");
    }
    
    // Use ContentTemplateSid for the approved template ID
    formData.append("ContentTemplateSid", templateId);
    
    // Create template variables in the format Twilio Conversations API expects
    // This is different from the Messages API format
    const parameters: Record<string, string> = {};
    templateParams.forEach((param, index) => {
      parameters[`${index+1}`] = param;
    });
    
    // Add parameters as a JSON string in the Attributes field
    // Include the language code
    const attributes = JSON.stringify({
      parameters: parameters,
      language: languageCode  // Add language code to attributes
    });
    
    formData.append("Attributes", attributes);
    
    console.log(`Using ContentTemplateSid: ${templateId}`);
    console.log(`Using Attributes: ${attributes}`);
  } else {
    // For standard messages using the Messages API
    formData.append("To", formattedTo);
    formData.append("From", formattedFrom);
    
    // For standard messages
    const finalMessage = recipientName 
      ? `Hello ${recipientName}, ${message}`
      : message;
      
    // Add trigger keyword information if provided
    const completeMessage = requestData.triggerKeyword 
      ? `${finalMessage}\n\nTo trigger this alert in an emergency, send "${requestData.triggerKeyword}" to this number.`
      : finalMessage;
    
    console.log(`Using standard message with length: ${completeMessage.length} characters`);
    formData.append("Body", completeMessage);
  }
  
  return formData;
}
