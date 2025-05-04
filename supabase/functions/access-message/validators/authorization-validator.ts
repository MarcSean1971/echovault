
import { getMessage, getMessageCondition } from "../message-service.ts";
import { isAuthorizedRecipient } from "../security-service.ts";

/**
 * Validate message authorization and return message data
 */
export async function validateMessageAuthorization(messageId: string, recipientEmail: string) {
  // 1. Get the message
  const { data: message, error: messageError } = await getMessage(messageId);
    
  if (messageError) {
    console.error("Error fetching message:", messageError);
    throw new Error("Message not found");
  }
  
  // 2. Get the message condition to check security settings and recipients
  const { data: condition, error: conditionError } = await getMessageCondition(messageId);
    
  if (conditionError) {
    console.error("Error fetching message condition:", conditionError);
    throw new Error("Message condition not found");
  }
  
  // 3. Verify that the recipient is authorized to access this message
  const authorizedRecipients = condition.recipients || [];
  const isAuthorized = isAuthorizedRecipient(authorizedRecipients, recipientEmail);
  
  if (!isAuthorized) {
    console.error(`Unauthorized access attempt by ${recipientEmail} for message ${messageId}`);
    throw new Error("You are not authorized to access this message");
  }
  
  return { message, condition, authorizedRecipients };
}
