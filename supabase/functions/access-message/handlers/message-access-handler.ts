
import { corsHeaders } from "../cors-headers.ts";
import { renderMessagePage, renderErrorPage } from "../template.ts";
import { validateMessageRequest, validateMessageAuthorization, checkSecurityConditions } from "../message-validator.ts";
import { getDeliveryRecord, createDeliveryRecord } from "../delivery-service.ts";
import { findRecipientByEmail } from "../security-service.ts";

/**
 * Handle the main message access functionality
 */
export async function handleMessageAccess(req: Request, url: URL): Promise<Response> {
  // Set HTML content type for all HTML responses with proper headers
  const htmlHeaders = { 
    "Content-Type": "text/html; charset=utf-8", 
    ...corsHeaders 
  };
  
  try {
    // Validate request parameters
    const validatedParams = await validateRequestParameters(url, htmlHeaders);
    if (validatedParams instanceof Response) {
      return validatedParams;
    }
    
    const { messageId, recipientEmail, deliveryId } = validatedParams;
    console.log(`Access request for message ${messageId} by recipient ${recipientEmail} with delivery ID ${deliveryId}`);
    
    // Validate message authorization
    const authResult = await validateMessageAuth(messageId, recipientEmail, htmlHeaders);
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
      recipientEmail,
      htmlHeaders
    );
    
  } catch (error: any) {
    console.error("Error processing message access request:", error);
    const errorHtml = renderErrorPage("Error", `Error processing request: ${error.message}`);
    return new Response(errorHtml, { 
      status: 500, 
      headers: htmlHeaders
    });
  }
}

/**
 * Validate request parameters and return them or an error response
 */
async function validateRequestParameters(url: URL, htmlHeaders: Record<string, string>): Promise<{ messageId: string, recipientEmail: string, deliveryId: string } | Response> {
  try {
    const validatedParams = await validateMessageRequest(url);
    return validatedParams;
  } catch (paramError: any) {
    console.error("Parameter validation error:", paramError.message);
    const errorHtml = renderErrorPage("Error", paramError.message);
    return new Response(errorHtml, { 
      status: 400, 
      headers: htmlHeaders
    });
  }
}

/**
 * Validate message authorization and return message data or error response
 */
async function validateMessageAuth(messageId: string, recipientEmail: string, htmlHeaders: Record<string, string>): Promise<{ 
  message: any, 
  condition: any, 
  authorizedRecipients: any[] 
} | Response> {
  try {
    return await validateMessageAuthorization(messageId, recipientEmail);
  } catch (authError: any) {
    console.error("Authorization error:", authError.message);
    const errorHtml = renderErrorPage("Access Denied", authError.message);
    return new Response(errorHtml, { 
      status: authError.message.includes("not found") ? 404 : 403, 
      headers: htmlHeaders
    });
  }
}

/**
 * Log delivery record status
 */
function logDeliveryStatus(messageId: string, deliveryId: string, deliveryResult: any) {
  if (deliveryResult) {
    console.log(`Found existing delivery record for message ${messageId} with delivery ID ${deliveryId}`);
  } else {
    console.log(`No delivery record found for message ${messageId} with delivery ID ${deliveryId}, but continuing with access check`);
  }
}

/**
 * Log security settings for debugging
 */
function logSecuritySettings(securitySettings: any, condition: any) {
  const { hasPinCode, pinVerified, hasDelayedAccess, hasExpiry, isExpired } = securitySettings;
  
  console.log(`Security settings: hasPinCode=${hasPinCode}, pinVerified=${pinVerified}, hasDelayedAccess=${hasDelayedAccess}, hasExpiry=${hasExpiry}, isExpired=${isExpired}`);
  console.log(`Message condition type: ${condition.condition_type}, PIN code exists: ${!!condition.pin_code}`);
}

/**
 * Process the delivery record for the message
 */
async function processDeliveryRecord(
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
 * Generate the appropriate response based on security conditions
 */
function generateResponseBasedOnSecuritySettings(
  message: any,
  securitySettings: any,
  deliveryId: string,
  recipientEmail: string,
  htmlHeaders: Record<string, string>
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
    return generateExpiredMessageResponse(message, expiryDate, deliveryId, recipientEmail, htmlHeaders);
  }
  
  // If delayed access and still within delay period, show waiting message
  if (hasDelayedAccess && unlockDate && unlockDate > new Date()) {
    return generateDelayedMessageResponse(message, unlockDate, expiryDate, deliveryId, recipientEmail, htmlHeaders);
  }
  
  // If PIN protected and not yet verified, show PIN form
  if (hasPinCode && !pinVerified) {
    return generatePinProtectedResponse(message, expiryDate, deliveryId, recipientEmail, htmlHeaders);
  }
  
  // All security checks passed, show the message
  return generateFullMessageResponse(message, expiryDate, deliveryId, recipientEmail, htmlHeaders);
}

/**
 * Generate response for expired messages
 */
function generateExpiredMessageResponse(
  message: any, 
  expiryDate: Date | null, 
  deliveryId: string, 
  recipientEmail: string, 
  htmlHeaders: Record<string, string>
): Response {
  const html = renderMessagePage(
    message,
    false, // No PIN needed for expired messages
    false, // No delay needed for expired messages
    null,
    expiryDate?.toISOString(),
    true, // isExpired
    deliveryId,
    recipientEmail
  );
  
  console.log("Sending expired message HTML response with Content-Type:", htmlHeaders["Content-Type"]);
  return new Response(html, { headers: htmlHeaders });
}

/**
 * Generate response for delayed messages
 */
function generateDelayedMessageResponse(
  message: any,
  unlockDate: Date,
  expiryDate: Date | null,
  deliveryId: string,
  recipientEmail: string,
  htmlHeaders: Record<string, string>
): Response {
  const html = renderMessagePage(
    { id: message.id, title: message.title, created_at: message.created_at },
    false, // No PIN for delay message
    true,  // Is delayed
    unlockDate.toISOString(),
    expiryDate?.toISOString(),
    false, // Not expired
    deliveryId,
    recipientEmail
  );
  
  console.log("Sending delayed message HTML response with Content-Type:", htmlHeaders["Content-Type"]);
  return new Response(html, { headers: htmlHeaders });
}

/**
 * Generate response for PIN protected messages
 */
function generatePinProtectedResponse(
  message: any,
  expiryDate: Date | null,
  deliveryId: string,
  recipientEmail: string,
  htmlHeaders: Record<string, string>
): Response {
  console.log("Sending PIN protected message - PIN is required and not verified");
  const html = renderMessagePage(
    { id: message.id, title: "PIN Protected Message" },
    true,  // Is PIN protected
    false, // Not delayed
    null,
    expiryDate?.toISOString(),
    false, // Not expired
    deliveryId,
    recipientEmail
  );
  
  console.log("Sending PIN protected message HTML response with Content-Type:", htmlHeaders["Content-Type"]);
  return new Response(html, { headers: htmlHeaders });
}

/**
 * Generate response for full message content
 */
function generateFullMessageResponse(
  message: any,
  expiryDate: Date | null,
  deliveryId: string,
  recipientEmail: string,
  htmlHeaders: Record<string, string>
): Response {
  console.log("Security checks passed, showing full message content");
  const html = renderMessagePage(
    message,
    false, // PIN already verified or not required
    false, // Delay already passed or not required
    null,
    expiryDate?.toISOString(),
    false, // Not expired
    deliveryId,
    recipientEmail
  );
  
  console.log("Sending full message HTML response with Content-Type:", htmlHeaders["Content-Type"]);
  console.log(`HTML response length: ${html.length} bytes`);
  
  return new Response(html, { headers: htmlHeaders });
}
