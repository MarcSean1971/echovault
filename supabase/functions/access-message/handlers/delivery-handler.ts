
import { findRecipientByEmail } from "../security-service.ts";
import { getDeliveryRecord, createDeliveryRecord } from "../delivery-service.ts";

/**
 * Process the delivery record for the message
 */
export async function processDeliveryRecord(
  messageId: string, 
  deliveryId: string, 
  condition: any, 
  authorizedRecipients: any[], 
  recipientEmail: string
) {
  try {
    // Check for message delivery record
    const { data: deliveryRecord, error: deliveryError } = await getDeliveryRecord(messageId, deliveryId);
      
    if (deliveryError) {
      console.error("Error checking delivery record:", deliveryError);
    }
    
    if (!deliveryRecord) {
      return await createNewDeliveryRecord(messageId, condition, authorizedRecipients, recipientEmail, deliveryId);
    }
    
    return deliveryRecord;
  } catch (error) {
    console.error("Error processing delivery record:", error);
    // Return null but continue processing the request
    return null;
  }
}

/**
 * Create a new delivery record if needed
 */
async function createNewDeliveryRecord(
  messageId: string,
  condition: any,
  authorizedRecipients: any[],
  recipientEmail: string,
  deliveryId: string
) {
  console.warn(`No delivery record found for message ${messageId} with delivery ID ${deliveryId}`);
  
  try {
    // Find the recipient ID from the authorized recipients list
    const recipient = findRecipientByEmail(authorizedRecipients, recipientEmail);
    
    if (recipient && recipient.id) {
      console.log(`Creating new delivery record for message ${messageId}, recipient ${recipient.id}, delivery ID ${deliveryId}`);
      
      const { error: createError } = await createDeliveryRecord(
        messageId,
        condition.id,
        recipient.id,
        deliveryId
      );
        
      if (createError) {
        console.error("Error creating delivery record:", createError);
        console.error("Error details:", JSON.stringify(createError));
        // Continue as the user is already authorized by email
        return null;
      } else {
        console.log(`Created delivery record for message ${messageId} and recipient ${recipient.id}`);
        // Return the newly created record (or null for now)
        return null;
      }
    } else {
      console.warn(`Couldn't find recipient with email ${recipientEmail} in authorized recipients`);
      return null;
    }
  } catch (recordError) {
    console.error("Error creating delivery record:", recordError);
    // Continue anyway as the recipient is authorized by email
    return null;
  }
}

/**
 * Log delivery record status
 */
export function logDeliveryStatus(messageId: string, deliveryId: string, deliveryResult: any) {
  if (deliveryResult) {
    console.log(`Found existing delivery record for message ${messageId} with delivery ID ${deliveryId}`);
  } else {
    console.log(`No delivery record found for message ${messageId} with delivery ID ${deliveryId}, but continuing with access check`);
  }
}
