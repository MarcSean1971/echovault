
import { corsHeaders } from "../cors-headers.ts";
import { validateRequestParameters, validateMessageAuth, logSecuritySettings, determineSecurityResponse } from "./security-utils.ts";
import { processDeliveryRecord, logDeliveryStatus } from "./delivery-handler.ts";
import { checkSecurityConditions } from "../message-validator.ts";
import { 
  generateExpiredMessageResponse,
  generateDelayedMessageResponse,
  generatePinProtectedResponse,
  generateFullMessageResponse,
  generateErrorResponse,
  htmlHeaders
} from "./response-utils.ts";

/**
 * Handle the main message access functionality
 */
export async function handleMessageAccess(req: Request, url: URL): Promise<Response> {
  try {
    // Validate request parameters
    const validatedParams = await validateRequestParameters(url);
    if (validatedParams instanceof Response) {
      return validatedParams;
    }
    
    const { messageId, recipientEmail, deliveryId } = validatedParams;
    console.log(`Access request for message ${messageId} by recipient ${recipientEmail} with delivery ID ${deliveryId}`);
    
    // Validate message authorization
    const authResult = await validateMessageAuth(messageId, recipientEmail);
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { message, condition, authorizedRecipients } = authResult;
    
    // Process delivery record
    const deliveryResult = await processDeliveryRecord(messageId, deliveryId, condition, authorizedRecipients, recipientEmail);
    logDeliveryStatus(messageId, deliveryId, deliveryResult);
    
    // Check security settings and generate appropriate response
    const securitySettings = checkSecurityConditions(condition, deliveryResult);
    logSecuritySettings(securitySettings, condition);
    
    // Return the appropriate response based on security conditions
    return generateResponseBasedOnSecuritySettings(
      message,
      securitySettings,
      deliveryId,
      recipientEmail
    );
    
  } catch (error: any) {
    console.error("Error processing message access request:", error);
    return generateErrorResponse("Error", `Error processing request: ${error.message}`);
  }
}

/**
 * Generate the appropriate response based on security conditions
 */
function generateResponseBasedOnSecuritySettings(
  message: any,
  securitySettings: any,
  deliveryId: string,
  recipientEmail: string
): Response {
  const { 
    hasPinCode, 
    hasDelayedAccess, 
    hasExpiry, 
    unlockDate, 
    expiryDate, 
    isExpired, 
    pinVerified 
  } = securitySettings;

  // If expired, show expired message
  if (isExpired) {
    return generateExpiredMessageResponse(message, expiryDate, deliveryId, recipientEmail);
  }
  
  // If delayed access and still within delay period, show waiting message
  if (hasDelayedAccess && unlockDate && unlockDate > new Date()) {
    return generateDelayedMessageResponse(message, unlockDate, expiryDate, deliveryId, recipientEmail);
  }
  
  // If PIN protected and not yet verified, show PIN form
  if (hasPinCode && !pinVerified) {
    return generatePinProtectedResponse(message, expiryDate, deliveryId, recipientEmail);
  }
  
  // All security checks passed, show the message
  return generateFullMessageResponse(message, expiryDate, deliveryId, recipientEmail);
}
