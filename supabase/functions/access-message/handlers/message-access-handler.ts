
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
    let messageId, recipientEmail, deliveryId;
    try {
      const validatedParams = await validateMessageRequest(url);
      messageId = validatedParams.messageId;
      recipientEmail = validatedParams.recipientEmail;
      deliveryId = validatedParams.deliveryId;
      console.log(`Validated params: messageId=${messageId}, recipient=${recipientEmail}, deliveryId=${deliveryId}`);
    } catch (paramError: any) {
      console.error("Parameter validation error:", paramError.message);
      const errorHtml = renderErrorPage("Error", paramError.message);
      return new Response(errorHtml, { 
        status: 400, 
        headers: htmlHeaders
      });
    }
    
    console.log(`Access request for message ${messageId} by recipient ${recipientEmail} with delivery ID ${deliveryId}`);
    
    // Validate message authorization - this checks if the message exists and if the recipient is authorized
    let message, condition, authorizedRecipients;
    try {
      const authResult = await validateMessageAuthorization(messageId, recipientEmail);
      message = authResult.message;
      condition = authResult.condition;
      authorizedRecipients = authResult.authorizedRecipients;
    } catch (authError: any) {
      console.error("Authorization error:", authError.message);
      const errorHtml = renderErrorPage("Access Denied", authError.message);
      return new Response(errorHtml, { 
        status: authError.message.includes("not found") ? 404 : 403, 
        headers: htmlHeaders
      });
    }
    
    // Check for delivery record but continue even if not found
    const deliveryResult = await processDeliveryRecord(messageId, deliveryId, condition, authorizedRecipients, recipientEmail);
    
    // Log success or failure of delivery record retrieval
    if (deliveryResult) {
      console.log(`Found existing delivery record for message ${messageId} with delivery ID ${deliveryId}`);
    } else {
      console.log(`No delivery record found for message ${messageId} with delivery ID ${deliveryId}, but continuing with access check`);
    }
    
    // Check security settings
    const { 
      hasPinCode, 
      hasDelayedAccess, 
      hasExpiry, 
      unlockDate, 
      expiryDate, 
      isExpired, 
      pinVerified 
    } = checkSecurityConditions(condition, deliveryResult);
    
    // Log security settings for debugging
    console.log(`Security settings: hasPinCode=${hasPinCode}, pinVerified=${pinVerified}, hasDelayedAccess=${hasDelayedAccess}, hasExpiry=${hasExpiry}, isExpired=${isExpired}`);
    console.log(`Message condition type: ${condition.condition_type}, PIN code exists: ${!!condition.pin_code}`);
    
    // Return the appropriate response based on security conditions
    return generateAppropriateResponse(
      message, 
      hasPinCode, 
      hasDelayedAccess, 
      unlockDate, 
      expiryDate, 
      isExpired, 
      pinVerified,
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
      console.warn(`No delivery record found for message ${messageId} with delivery ID ${deliveryId}`);
      // Try to create a delivery record if it doesn't exist
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
          } else {
            console.log(`Created delivery record for message ${messageId} and recipient ${recipient.id}`);
          }
        } else {
          console.warn(`Couldn't find recipient with email ${recipientEmail} in authorized recipients`);
        }
      } catch (recordError) {
        console.error("Error creating delivery record:", recordError);
        // Continue anyway as the recipient is authorized by email
      }
    }
    
    return deliveryRecord;
  } catch (error) {
    console.error("Error processing delivery record:", error);
    // Return null but continue processing the request
    return null;
  }
}

/**
 * Generate the appropriate response based on security conditions
 */
function generateAppropriateResponse(
  message: any,
  hasPinCode: boolean,
  hasDelayedAccess: boolean,
  unlockDate: Date | null,
  expiryDate: Date | null,
  isExpired: boolean,
  pinVerified: boolean,
  deliveryId: string,
  recipientEmail: string,
  htmlHeaders: Record<string, string>
): Response {
  // If expired, show expired message
  if (isExpired) {
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
  
  // If delayed access and still within delay period, show waiting message
  if (hasDelayedAccess && unlockDate && unlockDate > new Date()) {
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
  
  // If PIN protected and not yet verified, show PIN form
  if (hasPinCode && !pinVerified) {
    console.log("Sending PIN protected message - PIN is required and not verified");
    const html = renderMessagePage(
      { id: message.id, title: "PIN Protected Message" },
      true,  // Is PIN protected
      false, // Not delayed (already passed delay check)
      null,
      expiryDate?.toISOString(),
      false, // Not expired
      deliveryId,
      recipientEmail
    );
    
    console.log("Sending PIN protected message HTML response with Content-Type:", htmlHeaders["Content-Type"]);
    return new Response(html, { headers: htmlHeaders });
  }
  
  // All security checks passed, show the message
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
  // Check if HTML is valid and content length
  console.log(`HTML response length: ${html.length} bytes`);
  
  return new Response(html, { headers: htmlHeaders });
}

/**
 * Render a simple error page
 */
function renderErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>${title}</title>
      </head>
      <body>
        <h1>${title}</h1>
        <p>${message}</p>
      </body>
    </html>
  `;
}
