
import { calculateSecurityDates, isAuthorizedRecipient } from "./security-service.ts";
import { getMessage, getMessageCondition } from "./message-service.ts";
import { getDeliveryRecord } from "./delivery-service.ts";

/**
 * Validate message access request parameters
 */
export async function validateMessageRequest(url: URL) {
  // Try to extract message ID from query parameters first
  let messageId = url.searchParams.get("id");
  
  // If not found in query params, try to extract from URL path (backwards compatibility)
  if (!messageId) {
    const pathParts = url.pathname.split('/');
    messageId = pathParts[pathParts.length - 1];
    // If last path part is the function name itself, then there's no ID in the path
    if (messageId === "access-message") {
      messageId = null;
    }
  }
  
  if (!messageId) {
    throw new Error("Missing message ID in both query parameters and URL path");
  }
  
  // Extract recipient and delivery info from query parameters
  const recipientEmail = url.searchParams.get("recipient");
  const deliveryId = url.searchParams.get("delivery");
  
  if (!recipientEmail || !deliveryId) {
    throw new Error(`Missing recipient (${recipientEmail}) or delivery information (${deliveryId})`);
  }
  
  return { messageId, recipientEmail, deliveryId };
}

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

/**
 * Check security conditions for message access
 */
export function checkSecurityConditions(condition: any, deliveryRecord: any) {
  // Fix: Explicitly check for pin_code existence instead of assuming it exists
  const hasPinCode = condition.pin_code && condition.pin_code.trim() !== '';
  
  // Log the PIN code status for debugging
  console.log(`Message security check: hasPinCode=${hasPinCode}, actual pin_code=${condition.pin_code || 'null'}`);
  
  const hasDelayedAccess = (condition.unlock_delay_hours || 0) > 0;
  const hasExpiry = (condition.expiry_hours || 0) > 0;
  
  // Calculate dates for delay and expiry
  const deliveryDate = deliveryRecord?.delivered_at 
    ? new Date(deliveryRecord.delivered_at) 
    : new Date(); // Fallback to current time if delivery date not available
  
  const { unlockDate, expiryDate, isExpired } = calculateSecurityDates(
    deliveryDate, 
    hasDelayedAccess, 
    hasExpiry, 
    condition.unlock_delay_hours || 0, 
    condition.expiry_hours || 0
  );
  
  // Check if the PIN has been verified for this session
  const pinVerified = deliveryRecord?.viewed_count && deliveryRecord.viewed_count > 0;
  
  return { 
    hasPinCode, 
    hasDelayedAccess, 
    hasExpiry, 
    unlockDate, 
    expiryDate, 
    isExpired, 
    pinVerified 
  };
}
