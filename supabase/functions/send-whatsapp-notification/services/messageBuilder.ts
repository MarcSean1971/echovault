
import { formatWhatsAppNumber, normalizePhoneNumber, WhatsAppMessageRequest } from "../models/whatsapp.ts";
import { getTwilioCredentials } from "../utils/env.ts";

/**
 * Build message form data for Twilio API
 * @param requestData The WhatsApp message request data
 * @returns FormData ready to send to Twilio API
 */
export function buildMessageFormData(requestData: WhatsAppMessageRequest): URLSearchParams {
  const { twilioWhatsappNumber } = getTwilioCredentials();
  const { 
    to, 
    message, 
    recipientName,
    useTemplate = false,
    templateId = '',
    templateParams = [] 
  } = requestData;
  
  // Process phone number to ensure consistency
  const normalizedPhoneNumber = normalizePhoneNumber(to);
  
  // Format the WhatsApp numbers correctly
  const formattedTo = formatWhatsAppNumber(normalizedPhoneNumber);
  const formattedFrom = formatWhatsAppNumber(twilioWhatsappNumber);
  
  // Create form data for the request
  const formData = new URLSearchParams();
  formData.append("To", formattedTo);
  formData.append("From", formattedFrom);
  
  console.log(`To: ${formattedTo}`);
  console.log(`From: ${formattedFrom}`);
  
  if (useTemplate && templateId) {
    console.log(`Using template with ID: ${templateId}`);
    
    // Use ContentSid for the approved template ID
    formData.append("ContentSid", templateId);
    
    // Create template variables in the format Twilio expects
    const variables: Record<string, string> = {};
    templateParams.forEach((param, index) => {
      variables[`${index+1}`] = param;
    });
    
    // Add ContentVariables as a JSON string
    formData.append("ContentVariables", JSON.stringify(variables));
    
    console.log(`Using ContentSid: ${templateId}`);
    console.log(`Using ContentVariables: ${JSON.stringify(variables)}`);
  } else {
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
